"""Build the park's skinned Stegosaurus with editable materials and a glTF atlas.

Blender 4.5+:
  blender -b -t 6 -P build_stegosaurus_realtime.py -- <output.glb> <output.blend>

The neighboring stegosaurus.blend provides the source body and bone hierarchy.
The exported model faces +X in meters with glTF's +Y up and has no scene lights.
"""

import argparse
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Quaternion, Vector

SOURCE = Path(__file__).with_name("stegosaurus.blend")
FPS = 30



def pigment(hex_color):
    def linear(channel):
        return channel / 12.92 if channel <= .04045 else ((channel + .055) / 1.055) ** 2.4

    return Vector([linear(int(hex_color[i:i + 2], 16) / 255) for i in (0, 2, 4)])


def phase_curve(phase, points):
    for (a, v0), (b, v1) in zip(points, points[1:]):
        if phase <= b:
            t = min(1, max(0, (phase - a) / (b - a)))
            return v0 + (v1 - v0) * t * t * (3 - 2 * t)
    return points[-1][1]


def paint_skin(vertex):
    x, y, z = vertex
    high = min(1, max(0, (z - .73) / 1.1))
    throat = min(1, max(0, (x - .68) / 1.10))
    belly_line = 1.15 + .15 * throat + .052 * math.sin(x * 2.1 + .53)
    belly = min(1, max(0, (belly_line - z) / .34))
    belly = belly * belly * (3 - 2 * belly)
    if abs(y) > .34:
        belly *= max(.58, min(1, (z - .24) * 1.6 + .55))
    olive = pigment("9ABD54").lerp(pigment("688D46"), high * .53)
    olive = olive.lerp(pigment("F1B64D"), belly * .88)
    cheek = min(.24, max(0, (x - 1.4) * .27)) * max(0, math.cos(z * 2.8 - 3.05))
    olive = olive.lerp(pigment("E7BD5D"), cheek)
    # Three individually shaped fern markings replace equal-width zebra stripes.
    marking = 0
    for center, level, width, depth, slant in (
        (-1.13, 1.48, .29, .43, -.32), (-.46, 1.56, .29, .45, .38), (.27, 1.45, .25, .43, .29),
    ):
        dz = z - level
        curve = dz * slant + math.sin(dz * 7 + center) * .046
        distance = ((x - center - curve) / width) ** 2 + (dz / depth) ** 2
        marking = max(marking, min(1, max(0, (1.12 - distance) / .34)))
    arc = x * 1.18 + z * .70 + abs(y) * .31
    tail = min(1, max(0, (-1.11 - x) / .68))
    tail *= max(0, (.5 + .5 * math.cos(math.tau * arc) - .46) * 1.85)
    fern = pigment("547940").lerp(pigment("7F9445"), belly * .32)
    return olive.lerp(fern, max(marking * .78, tail * .53) * (1 - .62 * belly))


def paint_leg(vertex):
    x, y, z = vertex
    warm = min(1, max(0, (.76 - z) * 1.28))
    olive = pigment("A0AF52").lerp(pigment("83934A"), warm)
    outer = min(1, max(0, (abs(y) - .53) * 4.2))
    haunch = math.exp(-((x + .69) / .60) ** 2 - ((z - .89) / .40) ** 2)
    olive = olive.lerp(pigment("668140"), outer * haunch * .48)
    return olive.lerp(paint_skin(vertex), min(.31, max(0, (z - .57) * .47)))


def set_pigment(mesh, function):
    layer = mesh.color_attributes.get("Pigment")
    if layer is None:
        layer = mesh.color_attributes.new(name="Pigment", type="FLOAT_COLOR", domain="POINT")
    layer.data.foreach_set("color", [channel for vertex in mesh.vertices for channel in (*function(vertex.co), 1)])


def art_mesh(collection, rig, name, points, faces, materials, joint):
    data = bpy.data.meshes.new(name)
    data.from_pydata(points, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    for material in materials:
        data.materials.append(material)
    for face in data.polygons:
        face.use_smooth = True
    mod = obj.modifiers.new("Character armature", "ARMATURE")
    mod.object = rig
    mod.use_deform_preserve_volume = True
    obj.vertex_groups.new(name=joint).add(list(range(len(points))), 1, "REPLACE")
    rest = data.attributes.new(name="RestPosition", type="FLOAT_VECTOR", domain="POINT")
    rest.data.foreach_set("vector", [value for point in points for value in point])
    return obj


def quad_grid(rows, cols):
    for i in range(rows - 1):
        for j in range(cols):
            point = i * cols + j
            next_point = i * cols + (j + 1) % cols
            yield (point, next_point, next_point + cols, point + cols)


def sculpt_plates(collection, rig, materials):
    copper = materials["Plates • copper faces"]
    bevel = materials["Plates • golden beveled rims"]
    # The pair of staggered rows has a few defining peaks and a clear taper into the tail.
    near = (
        (1.22, 1.30, .35, .38, "neck"), (.79, 1.47, .54, .63, "root"),
        (.25, 1.64, .75, .92, "root"), (-.43, 1.81, .86, 1.08, "root"),
        (-1.05, 1.74, .65, .83, "root"), (-1.58, 1.63, .52, .60, "tail.01"),
        (-2.10, 1.45, .38, .41, "tail.02"),
    )
    far = (
        (1.00, 1.42, .49, .57, "root"), (.55, 1.58, .60, .91, "root"),
        (-.02, 1.78, .76, 1.19, "root"), (-.63, 1.83, .91, 1.29, "root"),
        (-1.26, 1.70, .70, .93, "tail.01"), (-1.83, 1.53, .50, .64, "tail.02"),
    )
    outlines = (
        ((-.35, -.07), (-.53, .29), (-.49, .57), (-.12, 1.0), (.19, .89), (.49, .53), (.43, .19), (.23, -.045)),
        ((-.43, -.08), (-.54, .28), (-.42, .61), (-.19, .94), (.07, 1.02), (.44, .68), (.53, .31), (.24, -.038)),
        ((-.42, -.06), (-.50, .25), (-.38, .64), (-.035, 1.00), (.24, .91), (.50, .54), (.44, .20), (.26, -.035)),
    )
    result = []
    for row, definitions, sign in (("near", near, -1), ("far", far, 1)):
        for index, (x, root, width, height, joint) in enumerate(definitions):
            outline = outlines[(index + (sign > 0)) % len(outlines)]
            contour = []
            for i, here in enumerate(outline):
                before, after = outline[i - 1], outline[(i + 1) % len(outline)]
                contour.extend(tuple(.82 * a + .18 * b for a, b in zip(here, side)) for side in (before, after))
            thickness = min(.176, .066 + .126 * width)
            layers = ((-.98, .45), (-1, .78), (-.71, .94), (-.2, 1), (.2, 1), (.71, .94), (1, .78), (.98, .45))
            points = []
            for depth, shrink in layers:
                for u, v in contour:
                    z = .41 + (v - .41) * shrink
                    along = u * shrink - .12 * z * z
                    lean = sign * (.30 + .13 * z * height)
                    points.append((x + along * width, lean + depth * thickness, root + height * z))
            ring = len(contour)
            faces = list(quad_grid(len(layers), ring))
            surface = len(faces)
            far_cap = len(points) - ring
            for depth, edge in ((-1, 0), (1, far_cap)):
                peak = len(points)
                z = .50
                points.append((x - .09 * width, sign * (.30 + .13 * z * height) + depth * thickness * 1.18,
                               root + height * z))
                faces.extend((peak, edge + i, edge + (i + 1) % ring) for i in range(ring))
            blade = art_mesh(collection, rig, f"Copper crest | {row} {index + 1}", points, faces, [copper, bevel], joint)
            for poly in blade.data.polygons:
                layer = poly.index // ring
                poly.material_index = int(2 <= layer <= 4 and poly.index < surface)
                poly.use_smooth = poly.index < surface

            def plate_paint(point):
                z = min(1, max(0, (point.z - root) / height))
                u = (point.x - x) / width
                facet = max(0, math.cos(10 * math.atan2(u + .075, z + .16))) ** 4
                ruby = pigment("A33218").lerp(pigment("EF5C25"), .23 + .77 * z)
                return ruby.lerp(pigment("EF8A3B"), facet * (.22 + .29 * z))

            set_pigment(blade.data, plate_paint)
            result.append(blade)
    return result


def sculpt_face(collection, rig, materials):
    skin = materials["Skin • fern and bark markings"]
    groove = materials["Eyes • dark pupil"]
    iris = materials["Eyes • golden umber"]
    eyelid = materials["Skin • shaded bark green"]
    glint = materials["Eyes • glint"]
    # A single tapered skull keeps the broad forehead and blunt beak integral to the neck.
    profiles = (
        (1.53, .970, .204, .210), (1.67, 1.033, .274, .264),
        (1.84, 1.123, .389, .322), (2.012, 1.122, .433, .345),
        (2.150, 1.102, .421, .324), (2.267, 1.046, .376, .255),
        (2.381, .996, .330, .214), (2.488, .966, .282, .183),
        (2.564, .959, .165, .144), (2.593, .957, .023, .054),
    )

    def at(x):
        for a, b in zip(profiles, profiles[1:]):
            if x <= b[0]:
                s = min(1, max(0, (x - a[0]) / (b[0] - a[0])))
                return tuple((1 - s) * first + s * second for first, second in zip(a[1:], b[1:]))
        return profiles[-1][1:]

    def profile_point(x, angle):
        height, width, rise = at(x)
        side, up = math.cos(angle), math.sin(angle)
        z = height + rise * up
        cheek = math.exp(-((x - 2.06) / .252) ** 2 - ((z - .988) / .171) ** 2) * .25
        brow_tip = 1.35 - .29 * (x - 2.09)
        brow = math.exp(-((x - 2.105) / .182) ** 2 - ((z - brow_tip) / .058) ** 2)
        socket = math.exp(-((x - 2.15) / .125) ** 2 - ((z - 1.242) / .074) ** 2)
        side_height = width * side * (1 + cheek) + side * (.127 * brow - .028 * socket)
        return (x, side_height, z + .047 * brow * abs(side))

    def cheek_surface(x, z, side):
        height, _, rise = at(x)
        base_z = z
        for _ in range(4):
            angle = math.asin(min(.999, max(-.999, (base_z - height) / rise)))
            point = profile_point(x, angle if side > 0 else math.pi - angle)
            base_z += z - point[2]
        return abs(point[1])

    def build(name, points, faces, used):
        return art_mesh(collection, rig, name, points, faces, used, "head")

    points, rows, cols = [], 34, 48
    for row in range(rows):
        x = profiles[0][0] + (profiles[-1][0] - profiles[0][0]) * row / (rows - 1)
        for col in range(cols):
            points.append(profile_point(x, math.tau * col / cols))
    faces = list(quad_grid(rows, cols))
    faces += [tuple(reversed(range(cols))), tuple(range(len(points) - cols, len(points)))]
    skull = build("Head | contiguous brow, cheek and wedge beak", points, faces, [skin])

    def face_paint(point):
        x, y, z = point
        color = paint_skin(point)
        chin = min(.93, max(0, (1.163 - z) * 4.08))
        nose = min(.65, max(0, (x - 2.322) * 3.54))
        eye = math.exp(-((x - 2.15) / .160) ** 2 - ((z - 1.242) / .076) ** 2)
        eyebrow = math.exp(-((x - 2.106) / .168) ** 2 - ((z - 1.377 + .26 * (x - 2.106)) / .053) ** 2)
        color = color.lerp(pigment("F4C168"), chin).lerp(pigment("A46C39"), nose)
        return color.lerp(pigment("46573B"), .63 * eye).lerp(pigment("C6A851"), .34 * eyebrow)

    set_pigment(skull.data, face_paint)
    acc = [skull]
    for side in (-1, 1):
        mouth = []
        for step in range(25):
            blend = step / 24
            x = 1.996 + .592 * blend
            height, _, rise = at(x)
            arc = -.25 - .254 * math.sin(math.pi * blend) + .152 * blend
            z = height + rise * arc
            y = cheek_surface(x, z, side)
            radius = .0009 + .012 * (math.sin(math.pi * blend) ** .66)
            for angular in range(8):
                a = angular * math.tau / 8
                mouth.append((x, side * (y + .006 + radius * math.cos(a)), z + radius * math.sin(a)))
        acc.append(build(f"Head | tapered mouth seam {side:+d}", mouth, list(quad_grid(25, 8)), [groove]))
        eye_points, eye_cols, eye_rows = [], 40, 17
        eye_x, eye_z, eye_w, eye_h = 2.153, 1.245, .119, .077
        for row in range(eye_rows):
            radius = .015 + .985 * row / (eye_rows - 1)
            for col in range(eye_cols):
                angle = math.tau * col / eye_cols
                x = eye_x + eye_w * radius * math.cos(angle)
                z = eye_z + radius * (eye_h * math.sin(angle) - .028 * math.cos(angle))
                depth = .006 + .019 * (1 - radius ** 2)
                eye_points.append((x, side * (cheek_surface(x, z, side) + depth), z))
        eye = build(f"Head | inset amber eye {side:+d}", eye_points, list(quad_grid(eye_rows, eye_cols)),
                    [groove, iris, eyelid, glint])
        for poly in eye.data.polygons:
            center = poly.center
            radius = math.hypot((center.x - eye_x) / eye_w, (center.z - eye_z + (center.x - eye_x) * .28) / eye_h)
            pupil = math.hypot((center.x - eye_x - .011) / .037, (center.z - eye_z) / .048)
            bright = math.hypot((center.x - eye_x + .015) / .011, (center.z - eye_z - .020) / .009)
            sclera = center.x < eye_x - .055 and center.z < eye_z + .025 and radius < .80
            poly.material_index = 3 if bright < 1 or sclera else 0 if pupil < 1 else 2 if radius > .84 else 1
        acc.append(eye)
        brow = []
        for step in range(23):
            t = step / 22
            x = 1.953 + .332 * t
            z = 1.386 - .105 * t + math.sin(math.pi * t) * .072
            fullness = math.sin(math.pi * t) ** .42
            for col in range(16):
                angle = math.tau * col / 16
                up = z + math.sin(angle) * (.006 + .058 * fullness)
                y = cheek_surface(x, up, side) + math.cos(angle) * (.004 + .067 * fullness) + .018 * fullness
                brow.append((x, side * y, up))
        brow_shape = build(f"Head | angled solid brow {side:+d}", brow, list(quad_grid(23, 16)), [skin])
        set_pigment(brow_shape.data, lambda point: pigment("657D3C").lerp(pigment("9DB255"), min(1, max(0, (point.z - 1.3) * 4.0))))
        acc.append(brow_shape)
        nostril = []
        for row in range(5):
            radius = .01 + .99 * row / 4
            for col in range(20):
                angle = math.tau * col / 20
                x = 2.503 + .039 * radius * math.cos(angle)
                z = 1.035 + radius * (.021 * math.sin(angle) - .014 * math.cos(angle))
                nostril.append((x, side * (cheek_surface(x, z, side) + .006), z))
        acc.append(build(f"Head | inset nostril {side:+d}", nostril, list(quad_grid(5, 20)), [groove]))
    return acc


def sculpt(meshes):
    skin = bpy.data.materials["Skin • fern and bark markings"]
    nails = bpy.data.materials["Horn • warm ivory keratin"].copy()
    nails.name = "Nails • warm polished ivory"
    nail_ramp = next(node.color_ramp for node in nails.node_tree.nodes if node.bl_idname == "ShaderNodeValToRGB")
    for stop, color in zip(nail_ramp.elements, ("BB9564", "E9CC95", "FFF1CB")):
        stop.color = (*pigment(color), 1)
    for obj in meshes:
        geometry = obj.data
        if obj.name.startswith("Continuous skin"):
            for vertex in geometry.vertices:
                x, y, z = vertex.co
                torso = math.exp(-((x + .48) / 1.48) ** 4)
                shoulder = math.exp(-((x - .70) / .52) ** 2)
                haunch = math.exp(-((x + .9) / .51) ** 2 - ((z - 1.39) / .42) ** 2)
                tail_base = math.exp(-((x + 2.04) / .91) ** 2)
                neck_base = math.exp(-((x - 1.52) / .48) ** 2)
                high = max(0, z - 1.03)
                chest = shoulder * math.exp(-((z - .99) / .43) ** 2)
                vertex.co.y *= 1 + .075 * torso + .35 * chest + .17 * haunch + .32 * tail_base + .185 * neck_base
                vertex.co.z += high * (.075 * torso + .073 * shoulder + .15 * haunch)
                vertex.co.z += .084 * neck_base + .19 * tail_base * (z - 1.31)
            set_pigment(geometry, paint_skin)
        elif "connected leg" in obj.name:
            ring_size = 24  # Source leg rings run from hip to ankle.
            for start in range(0, len(geometry.vertices), ring_size):
                ring = geometry.vertices[start:start + ring_size]
                center = sum((v.co for v in ring), Vector()) / len(ring)
                calf = math.exp(-((center.z - .49) / .34) ** 2)
                ankle = math.exp(-((center.z - .18) / .18) ** 2)
                muscle = math.exp(-((center.z - .91) / .38) ** 2)
                forward = math.exp(-((center.z - .54) / .22) ** 2) * (.092 if obj.name.startswith("Fore") else -.042)
                for vertex in ring:
                    vertex.co.x += (vertex.co.x - center.x) * (.76 * calf + .42 * ankle + .22 * muscle) + forward
                    vertex.co.y += (vertex.co.y - center.y) * (.73 * calf + .43 * ankle + .24 * muscle)
                    vertex.co.y -= math.copysign(.092 * max(0, min(1, (center.z - .76) / .35)), center.y)
            set_pigment(geometry, paint_leg)
        elif any(feature in obj.name for feature in (" · padded foot", " · digit ", " · keratin cap ")):
            center = sum((v.co for v in geometry.vertices), Vector()) / len(geometry.vertices)
            cap = "keratin cap" in obj.name
            pad = "padded foot" in obj.name
            floor = min(vertex.co.z for vertex in geometry.vertices)
            top = max(vertex.co.z for vertex in geometry.vertices)
            hind = obj.name.startswith("Hind")
            ankle_y = math.copysign(.59 if hind else .46, center.y)
            for vertex in geometry.vertices:
                if cap:
                    vertex.co.x += .150 + (vertex.co.x - center.x) * .82
                    vertex.co.y = ankle_y + (center.y - ankle_y) * 1.55 + (vertex.co.y - center.y) * (1.46 if hind else 1.31)
                    vertex.co.z = .008 + .185 * (vertex.co.z - floor) / (top - floor)
                else:
                    vertex.co.x += (.075 if pad else .101) + (vertex.co.x - center.x) * .39
                    vertex.co.y += (vertex.co.y - ankle_y) * (.37 if pad else .55)
                    vertex.co.z = floor + max(0, vertex.co.z - floor) * (1.37 if pad else 1.18)
            geometry.materials.clear()
            geometry.materials.append(nails if cap else skin)
            if not cap:
                set_pigment(geometry, paint_leg)
        elif obj.name.startswith("Tail spike"):
            ring_size = 12
            for start in range(0, len(geometry.vertices), ring_size):
                ring = geometry.vertices[start:start + ring_size]
                center = sum((v.co for v in ring), Vector()) / len(ring)
                weight = start / len(geometry.vertices)
                for vertex in ring:
                    vertex.co += (vertex.co - center) * (.48 - .16 * weight)
        elif geometry.color_attributes.get("Pigment"):
            set_pigment(geometry, paint_skin)
        rest = geometry.attributes.get("RestPosition")
        if rest:
            rest.data.foreach_set("vector", [coordinate for vertex in geometry.vertices for coordinate in vertex.co])


def polish_materials(materials):
    for material in materials:
        graph = material.node_tree
        shader = graph.nodes.get("Principled BSDF")
        roughness = .58 if material.name.startswith("Skin") else .48
        shader.inputs["Roughness"].default_value = roughness
        mixes = [node for node in graph.nodes if node.bl_idname == "ShaderNodeMixRGB"]
        if material.name.startswith("Skin") and mixes:
            mixes[-1].inputs[0].default_value = .13
        for node in graph.nodes:
            if node.bl_idname == "ShaderNodeBump":
                node.inputs["Strength"].default_value = .15 if material.name.startswith("Skin") else .20
                node.inputs["Distance"].default_value = .007
            if node.bl_idname == "ShaderNodeTexVoronoi":
                node.inputs["Scale"].default_value = 19 if material.name.startswith("Skin") else 24
        if material.name.startswith("Plates • golden"):
            ramps = [node for node in graph.nodes if node.bl_idname == "ShaderNodeValToRGB"]
            for element, tint in zip(ramps[0].color_ramp.elements, ("D27A1E", "FFAE39", "FFDE82")):
                element.color = (*pigment(tint), 1)
        elif material.name.startswith("Plates • copper"):
            ramps = [node for node in graph.nodes if node.bl_idname == "ShaderNodeValToRGB"]
            ramps[0].color_ramp.elements[0].color = (*pigment("D1A472"), 1)
        elif material.name.startswith("Skin • honey"):
            ramps = [node for node in graph.nodes if node.bl_idname == "ShaderNodeValToRGB"]
            for element, tint in zip(ramps[0].color_ramp.elements, ("B18139", "D3A947", "EABB64")):
                element.color = (*pigment(tint), 1)
        elif material.name.startswith("Eyes • golden"):
            ramps = [node for node in graph.nodes if node.bl_idname == "ShaderNodeValToRGB"]
            for element, tint in zip(ramps[0].color_ramp.elements, ("AA5319", "FFA735", "FFC86A")):
                element.color = (*pigment(tint), 1)


def compact_silhouette(meshes, rig):
    # Retarget the actual joint lengths with the skin so the new proportions stay planted in motion.
    length_scale = .905
    for obj in meshes:
        for vertex in obj.data.vertices:
            vertex.co.x *= length_scale
        rest = obj.data.attributes.get("RestPosition")
        if rest:
            rest.data.foreach_set("vector", [value for vertex in obj.data.vertices for value in vertex.co])
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    for joint in rig.data.edit_bones:
        joint.head.x *= length_scale
        joint.tail.x *= length_scale
    bpy.ops.object.mode_set(mode="OBJECT")


def join_skin(meshes, rig):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        # Bake one subdivision level on each rounded plate before packing the atlas.
        bpy.context.view_layer.objects.active = obj
        for modifier in list(obj.modifiers):
            if modifier.type == "SUBSURF":
                bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = "Stegosaurus | articulated skin"
    obj.parent = rig
    armatures = [modifier for modifier in obj.modifiers if modifier.type == "ARMATURE"]
    if not armatures:
        obj.modifiers.new("Skeleton", "ARMATURE").object = rig
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(mesh, faces=list(mesh.faces))
    polygons = [face for face in mesh.faces if len(face.verts) > 4]
    bmesh.ops.triangulate(mesh, faces=polygons, ngon_method="BEAUTY")
    mesh.to_mesh(obj.data)
    mesh.free()
    # GlTF's tangent space and the normal bake share one explicit, nonoverlapping UV layout.
    while obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=.007, area_weight=.32)
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.data.uv_layers.active.name = "Export atlas"
    return obj


def bake_atlas(scene, body, texture_size):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 8
    scene.cycles.use_denoising = False
    scene.render.bake.margin = 9
    scene.render.bake.normal_space = "TANGENT"
    scene.render.bake.use_clear = True
    materials = list(dict.fromkeys(body.data.materials[:]))
    if None in materials:
        materials.remove(None)
    color = bpy.data.images.new("Stegosaurus | albedo and cavity", texture_size, texture_size, alpha=False)
    normal = bpy.data.images.new("Stegosaurus | pebbled hide", texture_size, texture_size, alpha=False)
    normal.colorspace_settings.name = "Non-Color"
    color.colorspace_settings.name = "sRGB"
    pending = []
    for material in materials:
        graph = material.node_tree
        shader = graph.nodes.get("Principled BSDF")
        output = next(node for node in graph.nodes if node.type == "OUTPUT_MATERIAL")
        base_color = shader.inputs["Base Color"]
        image_node = graph.nodes.new("ShaderNodeTexImage")
        image_node.image = color
        graph.nodes.active = image_node
        ambient = graph.nodes.new("ShaderNodeAmbientOcclusion")
        ambient.inputs["Distance"].default_value = .36
        ambient.samples = 8
        multiply = graph.nodes.new("ShaderNodeMixRGB")
        multiply.blend_type = "MULTIPLY"
        multiply.inputs[0].default_value = .32
        multiply.inputs[1].default_value = base_color.default_value
        if base_color.is_linked:
            graph.links.new(base_color.links[0].from_socket, multiply.inputs[1])
        graph.links.new(ambient.outputs["Color"], multiply.inputs[2])
        emission = graph.nodes.new("ShaderNodeEmission")
        graph.links.new(multiply.outputs[0], emission.inputs["Color"])
        graph.links.new(emission.outputs[0], output.inputs["Surface"])
        pending.append((graph, shader, output, image_node, emission, multiply, ambient))
    bpy.ops.object.bake(type="EMIT")
    print("Baked albedo and contact occlusion", flush=True)
    for graph, shader, output, image_node, emission, multiply, ambient in pending:
        graph.links.new(shader.outputs[0], output.inputs["Surface"])
        for node in (emission, multiply, ambient):
            graph.nodes.remove(node)
        image_node.image = normal
        graph.nodes.active = image_node
    bpy.ops.object.bake(type="NORMAL")
    print("Baked tangent-space hide detail", flush=True)
    for graph, _, _, node, *_ in pending:
        graph.nodes.remove(node)
    color.pack()
    normal.pack()
    return color, normal


def install_atlas(body, color, normal):
    material = bpy.data.materials.new("Stegosaurus | painted hide and copper plates")
    material.use_nodes = True
    graph = material.node_tree
    shader = graph.nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = .58
    shader.inputs["Specular IOR Level"].default_value = .32
    base_map = graph.nodes.new("ShaderNodeTexImage")
    base_map.image = color
    base_map.location = (-420, 210)
    detail = graph.nodes.new("ShaderNodeTexImage")
    detail.image = normal
    detail.location = (-420, -160)
    tangent = graph.nodes.new("ShaderNodeNormalMap")
    tangent.inputs["Strength"].default_value = .72
    tangent.location = (-160, -110)
    graph.links.new(base_map.outputs["Color"], shader.inputs["Base Color"])
    graph.links.new(detail.outputs["Color"], tangent.inputs["Color"])
    graph.links.new(tangent.outputs["Normal"], shader.inputs["Normal"])
    body.data.materials.clear()
    body.data.materials.append(material)
    body.data.polygons.foreach_set("material_index", [0] * len(body.data.polygons))
    # The rendered albedo already contains the painterly pigment. Avoid multiplying it a second time in glTF.
    color_layer = body.data.color_attributes.get("Pigment")
    if color_layer:
        body.data.color_attributes.remove(color_layer)


def add_animations(rig):
    rig.animation_data_clear()
    rig.animation_data_create()
    for clip in ("Idle", "Turn", "TailStrike"):
        prior = bpy.data.actions.get(clip)
        if prior and prior.users == 0:
            bpy.data.actions.remove(prior)
    model_bones = rig.pose.bones
    rest = {bone.name: bone.bone.matrix_local.to_quaternion() for bone in model_bones}
    z_axis = Vector((0, 0, 1))
    legs = [(f"{kind}.{side}", (kind == "fore") != (side == "near"))
            for kind in ("fore", "hind") for side in ("near", "far")]

    def set_world_delta(name, quaternion):
        model_bones[name].rotation_mode = "QUATERNION"
        model_bones[name].rotation_quaternion = rest[name].inverted() @ quaternion @ rest[name]

    def swing(name, pitch=0, yaw=0, roll=0):
        set_world_delta(name, Euler((roll, pitch, yaw), "XYZ").to_quaternion())

    def plant(prefix, target, root_delta, root_shift, foot_yaw):
        upper_name, lower_name, foot_name = (f"{prefix}.{part}" for part in ("upper", "lower", "foot"))
        a, b, c = (model_bones[name].bone.head_local.copy() for name in (upper_name, lower_name, foot_name))
        reach = root_delta.inverted() @ (target - root_shift) - a
        direction = reach.normalized()
        upper = (b - a).length
        lower = (c - b).length
        distance = min(upper + lower - .002, max(abs(upper - lower) + .005, reach.length))
        pole = b - a - direction * (b - a).dot(direction)
        pole.normalize()
        along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance)
        knee = a + direction * along + pole * math.sqrt(max(0, upper ** 2 - along ** 2))
        ankle = a + direction * distance
        upper_rotation = (b - a).rotation_difference(knee - a)
        lower_rotation = (c - b).rotation_difference(ankle - knee)
        set_world_delta(upper_name, upper_rotation)
        set_world_delta(lower_name, upper_rotation.inverted() @ lower_rotation)
        set_world_delta(foot_name, lower_rotation.inverted() @ root_delta.inverted() @ Quaternion(z_axis, foot_yaw))

    def turn_foot(phase, ankle, reverse):
        # Diagonal pairs take turns stepping, so the other pair still bears weight.
        centres = (.188, .438, .688, .938) if reverse else (.063, .313, .563, .813)
        yaw = 0
        for i, step in enumerate(centres):
            start = max(0, step - .061)
            end = min(1, step + .061)
            start_angle, end_angle = math.pi * i / 4, math.pi * (i + 1) / 4
            if phase < start:
                break
            if phase <= end:
                t = (phase - start) / (end - start)
                yaw = start_angle + (end_angle - start_angle) * t * t * (3 - 2 * t)
                return Quaternion(z_axis, yaw) @ ankle + Vector((0, 0, .13 * math.sin(math.pi * t))), yaw
            yaw = end_angle
        return Quaternion(z_axis, yaw) @ ankle, yaw

    def pose(kind, t):
        gait = math.tau * t
        yaw = pitch = roll = 0
        shift = Vector((0, 0, .019 * math.sin(gait)))
        neck = -.075 + .026 * math.sin(gait)
        head = .014 * math.cos(gait) - .014
        tail_yaw = .065 * math.sin(gait)
        tail_pitch = -.27 + .031 * math.sin(gait)
        if kind == "Turn":
            weight = math.sin(math.pi * t)
            yaw = math.pi * t * t * (3 - 2 * t)
            pitch, roll = -.045 * weight, .042 * math.sin(2 * gait) * weight
            shift = Vector((-.026 * weight, 0, -.07 * weight))
            tail_yaw, tail_pitch = -.36 * weight, -.27 + .165 * weight
            neck, head = -.075 - .052 * weight, .042 * weight
        elif kind == "TailStrike":
            tension = phase_curve(t, ((0,0), (.32,1), (.54,.63), (.76,.28), (1,0)))
            tail_yaw = phase_curve(t, ((0,0), (.29,-.68), (.49,.12), (.56,1.44), (.68,.9), (1,0)))
            tail_pitch = phase_curve(t, ((0,-.27), (.29,.32), (.56,-.16), (1,-.27)))
            shift = Vector((-.18 * tension, -.083 * tension, -.12 * tension))
            pitch, roll = .102 * tension, -.149 * math.sin(tail_yaw)
            neck, head = -.075 + .18 * tension, -.086 * tension
        delta = Euler((roll, pitch, yaw), "XYZ").to_quaternion()
        set_world_delta("root", delta)
        model_bones["root"].location = rest["root"].inverted() @ shift
        swing("neck", pitch=neck, yaw=-.046 * math.sin(gait) if kind == "Idle" else .057 * tail_yaw)
        swing("head", pitch=head)
        for i, weight in enumerate((.45, .29, .16, .10), 1):
            swing(f"tail.{i:02d}", yaw=tail_yaw * weight, pitch=tail_pitch * weight)
        for prefix, reverse in legs:
            ankle = model_bones[f"{prefix}.foot"].bone.head_local.copy()
            target, foot_yaw = turn_foot(t, ankle, reverse) if kind == "Turn" else (ankle, 0)
            plant(prefix, target, delta, shift, foot_yaw)

    for name, frames in (("Idle", 60), ("Turn", 33), ("TailStrike", 36)):
        action = bpy.data.actions.new(name)
        rig.animation_data.action = action
        for i in range(frames + 1):
            pose(name, i / frames)
            for bone in model_bones:
                bone.keyframe_insert("rotation_quaternion", frame=i, group=bone.name)
            model_bones["root"].keyframe_insert("location", frame=i, group="root")
        rig.animation_data.action = None
        track = rig.animation_data.nla_tracks.new()
        track.name = name
        strip = track.strips.new(name, 0, action)
        strip.name = name
        track.mute = True
    rig.animation_data.action = bpy.data.actions.get("Idle")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("glb", type=Path)
    parser.add_argument("blend", type=Path)
    parser.add_argument("--texture-size", type=int, default=1536)
    parser.add_argument("--preview", type=Path)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 0
    scene.frame_end = 60
    scene.render.threads_mode = "FIXED"
    scene.render.threads = 6
    bpy.context.preferences.filepaths.save_version = 0
    rig = next(obj for obj in scene.objects if obj.type == "ARMATURE")
    rig.animation_data_clear()
    for bone in rig.pose.bones:
        bone.location = (0, 0, 0)
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion = (1, 0, 0, 0)
    for obj in list(scene.objects):
        if obj.name.startswith(("Head ·", "Cheek ridge", "Supraorbital", "Eye ", "Nostril", "Back plate")):
            bpy.data.objects.remove(obj, do_unlink=True)
    meshes = [obj for obj in scene.objects if obj.type == "MESH"]
    sculpt(meshes)
    collection = meshes[0].users_collection[0]
    meshes += sculpt_plates(collection, rig, bpy.data.materials)
    meshes += sculpt_face(collection, rig, bpy.data.materials)
    compact_silhouette(meshes, rig)
    polish_materials({material for obj in meshes for material in obj.data.materials})
    body = join_skin(meshes, rig)
    print(f"Packed UVs for {len(body.data.vertices)} vertices", flush=True)
    color, normal = bake_atlas(scene, body, args.texture_size)
    install_atlas(body, color, normal)
    add_animations(rig)
    scene.frame_set(0)
    args.glb.parent.mkdir(parents=True, exist_ok=True)
    args.blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend.resolve()))
    rig.animation_data.action = None
    for track in rig.animation_data.nla_tracks:
        track.mute = False
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=str(args.glb.resolve()), export_format="GLB", use_selection=True,
        export_animation_mode="NLA_TRACKS", export_force_sampling=True,
        export_tangents=True, export_yup=True, export_materials="EXPORT",
    )
    if args.preview:
        for track in rig.animation_data.nla_tracks:
            track.mute = True
        rig.animation_data.action = bpy.data.actions.get("Idle")
        scene.frame_set(0)
        scene.render.resolution_x = 900
        scene.render.resolution_y = 640
        scene.camera.data.ortho_scale = 7.5
        scene.cycles.samples = 20
        scene.cycles.use_denoising = True
        scene.render.filepath = str(args.preview.resolve())
        bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
