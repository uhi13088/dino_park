"""Resolve logical handbook targets to actual PDF pages after Word reflow.

This module deliberately never infers a page from visible titles or footers.
Export Word bookmarks as PDF named destinations, then resolve their page-object
references.  The plan's old numbers are retained as provenance, not evidence.

LibreOffice's documented PDF option:
https://help.libreoffice.org/latest/en-US/text/shared/guide/pdf_params.html
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

from pypdf import PdfReader


BUNDLED_SOFFICE = (
    Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice'
)
PDF_EXPORT_FILTER = 'pdf:writer_pdf_Export:' + json.dumps({
    'ExportBookmarksToPDFDestination': {'type': 'boolean', 'value': 'true'},
}, separators=(',', ':'))
WORD_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


class DestinationError(ValueError):
    """A bookmark has no single verifiable PDF destination."""


def anchor(target: str) -> str:
    """Match build_guidebook.anchor without importing the mutable builder."""
    return 'gb_' + hashlib.sha256(target.encode()).hexdigest()[:26]


def export_pdf(docx_path, pdf_path, *, soffice=BUNDLED_SOFFICE,
               timeout=180, env=None) -> Path:
    """Export a PDF with every Word bookmark, using a private LO profile.

    The output is replaced only after a successful, nonempty export.  Callers
    should render PNGs from this same PDF so page evidence and QA cannot drift.
    Existing environment font configuration is inherited unless ``env`` is set.
    """
    source = Path(docx_path).resolve()
    destination = Path(pdf_path).resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.flow-export-', dir=destination.parent) as work:
        work = Path(work)
        profile = (work / 'profile').as_uri()
        command = [str(soffice), '-env:UserInstallation=' + profile,
                   '--invisible', '--headless', '--norestore', '--convert-to',
                   PDF_EXPORT_FILTER, '--outdir', str(work), str(source)]
        result = subprocess.run(command, capture_output=True, text=True,
                                timeout=timeout, env=env)
        generated = work / (source.stem + '.pdf')
        if result.returncode or not generated.is_file() or not generated.stat().st_size:
            raise DestinationError('Named-destination PDF export failed: '
                                   + result.stdout + result.stderr)
        # A default/ignored export flag must not silently pass as a usable PDF.
        if not PdfReader(generated).named_destinations:
            raise DestinationError('Export produced no PDF named destinations')
        os.replace(generated, destination)
    return destination


def docx_bookmark_names(docx_path) -> list[str]:
    """Read actual bookmark names, including unlinked non-heading bookmarks."""
    with zipfile.ZipFile(docx_path) as archive:
        root = ET.fromstring(archive.read('word/document.xml'))
    names = [node.attrib[WORD_NS + 'name']
             for node in root.iter(WORD_NS + 'bookmarkStart')]
    if len(names) != len(set(names)):
        raise DestinationError('Duplicate Word bookmark names')
    return names


def _name_aliases(name: str) -> set[str]:
    """Known exact name serializations, not a visible-text similarity match.

    The bundled LO exports project ``gb_<26 hex>`` as ``/gb5F<26 hex>`` in
    catalog /Dests.  It is not PDF's usual #5F escape: the bytes really are 5F.
    Both this fixture-verified representation and an unmodified name are valid.
    No generic hex decoding is attempted, avoiding ambiguous/colliding names.
    """
    aliases = {name, '/' + name}
    if re.fullmatch(r'gb_[0-9a-f]{26}', name):
        aliases.update({'gb5F' + name[3:], '/gb5F' + name[3:]})
    return aliases


def pdf_bookmark_pages(pdf_path, names) -> dict[str, dict]:
    """Resolve every required bookmark through /Dests or /Names/Dests.

    pypdf handles both catalog layouts and follows the destination's indirect
    page reference.  Missing, ambiguous, out-of-range, or unresolved names fail.
    """
    reader = PdfReader(pdf_path)
    destinations = reader.named_destinations
    resolved = {}
    for name in names:
        matches = sorted(_name_aliases(name) & destinations.keys())
        if len(matches) != 1:
            raise DestinationError(f'Expected one PDF destination for {name}; found {matches}')
        pdf_name = matches[0]
        destination = destinations[pdf_name]
        page_index = reader.get_destination_page_number(destination)
        if page_index is None or not 0 <= page_index < len(reader.pages):
            raise DestinationError(f'Unresolved PDF page reference for {name}')
        resolved[name] = {
            'actual_page': page_index + 1,
            'pdf_destination': pdf_name,
            'evidence': 'PDF named destination page-object reference',
        }
    return resolved


def resolve_goto_page(reader, destination) -> int:
    """Resolve a PDF GoTo destination to a one-based physical page.

    Accept a named destination, /Dest array, or /A GoTo action.  This helper is
    useful for checking existing hyperlinks against ``report['numbers']``; it
    does not attempt to identify an unnamed Word bookmark from its link text.
    """
    value = destination.get_object() if hasattr(destination, 'get_object') else destination
    if isinstance(value, dict):
        if '/A' in value:
            action = value['/A'].get_object()
            if action.get('/S') != '/GoTo':
                raise DestinationError('PDF action is not an internal GoTo')
            return resolve_goto_page(reader, action['/D'])
        if '/Dest' in value:
            return resolve_goto_page(reader, value['/Dest'])
        if '/D' in value:
            return resolve_goto_page(reader, value['/D'])
        if '/Page' in value:
            page = reader.get_destination_page_number(value)
            if page is not None and 0 <= page < len(reader.pages):
                return page + 1
    elif isinstance(value, str):
        names = reader.named_destinations
        candidates = {value, value.lstrip('/'), '/' + value.lstrip('/')} & names.keys()
        if len(candidates) == 1:
            return resolve_goto_page(reader, names[candidates.pop()])
    elif isinstance(value, (list, tuple)) and value:
        target = value[0]
        # PDF page references, not textual footer numbers or logical ordinals.
        reference = getattr(target, 'indirect_reference', None) or target
        identity = (getattr(reference, 'idnum', None), getattr(reference, 'generation', None))
        if identity[0] is not None:
            matches = [index + 1 for index, page in enumerate(reader.pages)
                       if (page.indirect_reference.idnum, page.indirect_reference.generation) == identity]
            if len(matches) == 1:
                return matches[0]
    raise DestinationError('Unresolved internal PDF GoTo destination')


def map_plan_pages(pdf_path, pages, old_numbers, *, docx_path=None) -> dict:
    """Map every logical plan target to its current physical PDF page.

    ``pages`` is the existing logical page list; ``old_numbers`` is the complete
    plan id/anchor map.  An optional DOCX closes coverage against every real Word
    bookmark, including bookmarks with no inbound link and no outline entry.
    Return ``numbers`` for all displayed navigation references, plus per-target
    old/actual provenance.  Logical records may share a physical page.
    """
    logical = {page['id'] for page in pages}
    logical.update(block['anchor'] for page in pages for block in page.get('blocks', [])
                   if block.get('anchor'))
    missing_numbers = logical - old_numbers.keys()
    if missing_numbers:
        raise DestinationError('Plan targets absent from old_numbers: ' + ', '.join(sorted(missing_numbers)))
    expected = {target: anchor(target) for target in old_numbers}
    if len(set(expected.values())) != len(expected):
        raise DestinationError('Project bookmark hash collision')
    names = list(expected.values())
    docx_names = docx_bookmark_names(docx_path) if docx_path is not None else names
    absent_docx = set(names) - set(docx_names)
    if absent_docx:
        raise DestinationError('Plan bookmarks missing from Word: ' + ', '.join(sorted(absent_docx)))
    unplanned_project_names = {name for name in docx_names if name.startswith('gb_')} - set(names)
    if unplanned_project_names:
        raise DestinationError('Unplanned Word project bookmarks: ' + ', '.join(sorted(unplanned_project_names)))
    destinations = pdf_bookmark_pages(pdf_path, docx_names)
    anchors = {target: {'bookmark': name, 'old_page': old_numbers[target],
                         **destinations[name]} for target, name in expected.items()}
    numbers = {target: item['actual_page'] for target, item in anchors.items()}
    return {
        'status': 'pass',
        'physical_pages': len(PdfReader(pdf_path).pages),
        'logical_pages': len(pages),
        'numbers': numbers,
        'anchors': anchors,
        'word_bookmarks': len(docx_names),
        'resolved_word_bookmarks': len(destinations),
        'docx_bookmark_pages': destinations,
        'changed_targets': [target for target, page in numbers.items() if page != old_numbers[target]],
        'pdf_sha256': hashlib.sha256(Path(pdf_path).read_bytes()).hexdigest(),
        'docx_sha256': hashlib.sha256(Path(docx_path).read_bytes()).hexdigest() if docx_path else None,
        'method': 'Complete named-destination coverage; no title, text, footer, or ordinal fallback',
    }


def fixture_check(directory) -> dict:
    """Exercise actual LO export/reflow plus both PDF destination structures."""
    from docx import Document
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from pypdf import PdfWriter
    from pypdf.generic import NameObject, DictionaryObject

    directory = Path(directory).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    names = ['first', 'same-page', 'second', 'unlinked']
    document = Document()
    for index, target in enumerate(names):
        # Repeated text deliberately makes title/text matching non-evidence.
        paragraph = document.add_paragraph('Repeated destination text')
        if index == 2:
            paragraph.paragraph_format.page_break_before = True
        start = OxmlElement('w:bookmarkStart')
        start.set(qn('w:id'), str(index + 1))
        start.set(qn('w:name'), anchor(target))
        paragraph._p.insert(1 if paragraph._p.pPr is not None else 0, start)
        end = OxmlElement('w:bookmarkEnd')
        end.set(qn('w:id'), str(index + 1))
        paragraph._p.append(end)
    # No hyperlinks and no heading styles: all bookmarks must still be mapped.
    docx = directory / 'flow-fixture.docx'
    pdf = directory / 'flow-fixture.pdf'
    document.save(docx)
    export_pdf(docx, pdf)
    pages = [{'id': 'first'}, {'id': 'same-page'},
             {'id': 'second', 'blocks': [{'anchor': 'unlinked'}]}]
    old = {'first': 1, 'same-page': 2, 'second': 3, 'unlinked': 3}
    report = map_plan_pages(pdf, pages, old, docx_path=docx)
    assert report['numbers'] == {'first': 1, 'same-page': 1, 'second': 2, 'unlinked': 2}
    assert report['resolved_word_bookmarks'] == 4
    reader = PdfReader(pdf)
    for name, item in report['docx_bookmark_pages'].items():
        destination = reader.named_destinations[item['pdf_destination']]
        assert resolve_goto_page(reader, destination) == item['actual_page']
        assert resolve_goto_page(reader, destination.dest_array) == item['actual_page']
        action = DictionaryObject({NameObject('/S'): NameObject('/GoTo'),
                                   NameObject('/D'): destination.dest_array})
        assert resolve_goto_page(reader, DictionaryObject({NameObject('/A'): action})) == item['actual_page']
        assert resolve_goto_page(reader, item['pdf_destination']) == item['actual_page']
    # Separate /Names/Dests name-tree fixture, using normal unescaped names.
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.add_blank_page(width=200, height=200)
    for target, page in report['numbers'].items():
        writer.add_named_destination(anchor(target), page - 1)
    name_tree = directory / 'names-tree.pdf'
    writer.write(name_tree)
    assert {target: item['actual_page'] for target, item in
            pdf_bookmark_pages(name_tree, [anchor(target) for target in names]).items()} == {
                anchor(target): page for target, page in report['numbers'].items()}
    try:
        pdf_bookmark_pages(pdf, [anchor('missing')])
    except DestinationError:
        pass
    else:
        raise AssertionError('Missing destination was silently accepted')
    report['fixture_checks'] = ['actual bundled LO /Dests export', 'unlinked body bookmarks',
                                'same-page destinations', 'logical3-to-physical2 reflow',
                                '/Names/Dests tree', 'GoTo name/array/action', 'missing target rejects']
    (directory / 'fixture-result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path)
    parser.add_argument('--docx', type=Path)
    parser.add_argument('--pdf', type=Path)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--export', action='store_true', help='Export the DOCX with named destinations first')
    parser.add_argument('--fixture', type=Path, help='Run a tiny real-LO regression fixture in this directory')
    args = parser.parse_args()
    if args.fixture:
        report = fixture_check(args.fixture)
    else:
        if not args.plan or not args.pdf or not args.out:
            parser.error('--plan, --pdf and --out are required unless --fixture is used')
        if args.export:
            if not args.docx:
                parser.error('--export requires --docx')
            export_pdf(args.docx, args.pdf)
        plan = json.loads(args.plan.read_text())
        report = map_plan_pages(args.pdf, plan['pages'], plan['numbers'], docx_path=args.docx)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: report[key] for key in ['status', 'physical_pages', 'logical_pages',
                                                  'word_bookmarks', 'resolved_word_bookmarks']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
