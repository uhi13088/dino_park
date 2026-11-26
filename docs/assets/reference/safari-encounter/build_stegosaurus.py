"""Build and render the 2.5D Stegosaurus encounter sprite with Blender.

Usage: blender -b -t 4 -P build_stegosaurus.py -- <source.blend> <frames-directory>
Frames render at twice the 192×160 atlas cell size for clean downsampling.
Append --preview to render the first frame and the strongest part of the tail swing.
Append --turn-only to render just the four authored turning frames.
"""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion, Vector


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
bpy.context.preferences.filepaths.save_version = 0

# The modeled animal faces +X. X projects toward the camera's bottom right.
BONE_SPEC = {
    "root": ((0, 0, 0), (0, 0, .70), None),
    "neck": ((1.03, 0, 1.23), (1.81, 0, .98), "root"),
    "head": ((1.81, 0, .98), (2.37, 0, .84), "neck"),
    "tail.01": ((-1.16, 0, 1.30), (-1.94, 0, 1.29), "root"),
    "tail.02": ((-1.94, 0, 1.29), (-2.70, 0, 1.32), "tail.01"),
    "tail.03": ((-2.70, 0, 1.32), (-3.37, 0, 1.40), "tail.02"),
    "tail.04": ((-3.37, 0, 1.40), (-3.89, 0, 1.51), "tail.03"),
}
LEGS = {}
for side, sign in (("near", -1), ("far", 1)):
    for limb, pivots in (
        ("hind", ((-.89, .51 * sign, 1.30), (-.62, .54 * sign, .75), (-.85, .59 * sign, .19))),
        ("fore", ((.78, .42 * sign, .98), (.61, .44 * sign, .55), (.82, .46 * sign, .18))),
    ):
        names = tuple(f"{limb}.{side}.{part}" for part in ("upper", "lower", "foot"))
        hip, knee, ankle = pivots
        BONE_SPEC[names[0]] = (hip, knee, "root")
        BONE_SPEC[names[1]] = (knee, ankle, names[0])
        BONE_SPEC[names[2]] = (ankle, (ankle[0] + .27, ankle[1], .10), names[1])
        LEGS[(limb, side)] = (names, pivots)

armature = bpy.data.armatures.new("Stegosaurus armature")
rig = bpy.data.objects.new("Stegosaurus • skeleton", armature)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
rig.show_in_front = True
rig.display_type = "WIRE"
bpy.ops.object.mode_set(mode="EDIT")
for name, (head, tail, parent) in BONE_SPEC.items():
    bone = armature.edit_bones.new(name)
    bone.head, bone.tail = head, tail
    if parent:
        bone.parent = armature.edit_bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")
REST = {name: bone.matrix_local.to_quaternion() for name, bone in armature.bones.items()}

asset = bpy.data.collections.new("Stegosaurus • skin and plates")
scene.collection.children.link(asset)


def pigment(hex_color):
    def linear(channel):
        return channel / 12.92 if channel < .04045 else ((channel + .055) / 1.055) ** 2.4

    return tuple(linear(int(hex_color[i:i + 2], 16) / 255) for i in (0, 2, 4))


def surface(name, colors, roughness=.62, detail=.24, vertex_color=None):
    colors = tuple(map(pigment, colors))
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*colors[1], 1)
    material.use_nodes = True
    graph = material.node_tree
    nodes, links = graph.nodes, graph.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Specular IOR Level"].default_value = .33
    rest = nodes.new("ShaderNodeAttribute")
    rest.attribute_name = "RestPosition"

    mottling = nodes.new("ShaderNodeTexNoise")
    mottling.inputs["Scale"].default_value = 5
    mottling.inputs["Detail"].default_value = 1.5
    links.new(rest.outputs["Vector"], mottling.inputs["Vector"])

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements.remove(ramp.color_ramp.elements[1])
    ramp.color_ramp.elements[0].position = .24
    ramp.color_ramp.elements[0].color = (*colors[0], 1)
    for position, color in ((.52, colors[1]), (.78, colors[2])):
        ramp.color_ramp.elements.new(position).color = (*color, 1)
    links.new(mottling.outputs["Fac"], ramp.inputs[0])
    tint = ramp.outputs[0]
    if vertex_color:
        painted = nodes.new("ShaderNodeVertexColor")
        painted.layer_name = vertex_color
        mix = nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = .23
        links.new(painted.outputs["Color"], mix.inputs[1])
        links.new(tint, mix.inputs[2])
        tint = mix.outputs[0]
    scales = nodes.new("ShaderNodeTexVoronoi")
    scales.feature = "DISTANCE_TO_EDGE"
    scales.inputs["Scale"].default_value = 18
    links.new(rest.outputs["Vector"], scales.inputs["Vector"])
    if detail:
        grooves = nodes.new("ShaderNodeValToRGB")
        grooves.color_ramp.elements[0].position = 0
        grooves.color_ramp.elements[0].color = (.32, .29, .25, 1)
        grooves.color_ramp.elements[1].position = .075
        links.new(scales.outputs["Distance"], grooves.inputs[0])
        tint_scale = nodes.new("ShaderNodeMixRGB")
        tint_scale.blend_type = "MULTIPLY"
        tint_scale.inputs[0].default_value = detail
        links.new(tint, tint_scale.inputs[1])
        links.new(grooves.outputs[0], tint_scale.inputs[2])
        tint = tint_scale.outputs[0]
    links.new(tint, shader.inputs["Base Color"])

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = detail
    bump.inputs["Distance"].default_value = .039
    links.new(scales.outputs["Distance"], bump.inputs["Height"])
    links.new(bump.outputs[0], shader.inputs["Normal"])
    return material


skin = surface("Skin • fern and bark markings", ("A8A08B", "DEDBC1", "FFFFFF"), vertex_color="Pigment")
dark_skin = surface("Skin • shaded bark green", ("535438", "626540", "797B52"))
belly = surface("Skin • honey underside", ("A17632", "C69745", "DDB760"))
plate = surface("Plates • copper faces", ("DCA67F", "F5C39B", "FFD9B2"), .56, .13,
                vertex_color="Pigment")
rim = surface("Plates • golden beveled rims", ("C97823", "EAA23B", "F0B958"), .50, .12)
horn = surface("Horn • warm ivory keratin", ("9B7549", "D4B786", "EACFA1"), .49, .11)
beak = surface("Beak • brown keratin", ("53331D", "775439", "987050"), .53, .09)
iris = surface("Eyes • golden umber", ("8B4017", "D89435", "EAB457"), .33, .03)
pupil = surface("Eyes • dark pupil", ("150E08", "21170D", "302210"), .24, 0)
glint = surface("Eyes • glint", ("E0BB79", "EFCE96", "FFE7B5"), .30, 0)
fern, moss, bark, cheek, leg = map(pigment, ("7D8D49", "606D40", "494A30", "AF8B46", "606944"))


def blend_color(left, right, weight):
    return tuple(a + (b - a) * weight for a, b in zip(left, right))


def skin_pigment(vertex):
    x, y, z = vertex
    # Bands follow the ribs and sweep toward the hips. The gradient warms into
    # the honey belly and keeps the darkest color inside the main markings.
    arc = x * 1.48 + .55 * abs(y) + .34 * z * z + .1 * math.sin(x * 2.25 + z * 2.0)
    stripe = .5 + .5 * math.cos(math.tau * arc)
    stripe = max(0, min(1, (stripe - .49) / .32))
    fade = max(0, min(1, (z - .56) / .68))
    flank = blend_color(cheek, fern, fade)
    if z < .76:
        limb_tint = max(0, min(1, (.76 - z) * 2.65))
        flank = blend_color(flank, leg, limb_tint)
    flank = blend_color(flank, moss, max(0, min(.55, (z - 1.26) * .85)))
    strength = stripe * (.56 + .44 * fade)
    if x > 1.67:
        strength *= max(0, min(1, (z - .86) * 7))
    return blend_color(flank, bark, strength)


def paint(data, palette):
    attribute = data.color_attributes.new(name="Pigment", type="FLOAT_COLOR", domain="POINT")
    for vertex, color in zip(data.vertices, attribute.data):
        color.color = (*palette(vertex.co), 1)


def bind(obj, bone=None, weights=None):
    for collection in tuple(obj.users_collection):
        collection.objects.unlink(obj)
    asset.objects.link(obj)
    rest = obj.data.attributes.new(name="RestPosition", type="FLOAT_VECTOR", domain="POINT")
    rest.data.foreach_set("vector", [coordinate for vertex in obj.data.vertices for coordinate in vertex.co])
    modifier = obj.modifiers.new("Stegosaurus skeleton", "ARMATURE")
    modifier.object = rig
    modifier.use_deform_preserve_volume = True
    if bone:
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1, "REPLACE")
    else:
        groups = {}
        for index, blends in enumerate(weights):
            for name, value in blends:
                if value <= .00001:
                    continue
                if name not in groups:
                    groups[name] = obj.vertex_groups.new(name=name)
                groups[name].add([index], value, "REPLACE")
    return obj


def mesh(name, vertices, faces, names, bone=None, weights=None, underside=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    for material in names:
        data.materials.append(material)
    for polygon in data.polygons:
        polygon.use_smooth = True
        if underside is not None:
            polygon.material_index = int(
                sum(vertices[i][2] for i in polygon.vertices) / len(polygon.vertices) < underside
            )
    return bind(obj, bone, weights)


def sphere(name, center, radii, material, bone, detail=1):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24 if detail else 16,
        ring_count=16 if detail else 10,
        location=center,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = radii
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.data.materials.append(material)
    if material == skin:
        paint(obj.data, skin_pigment)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return bind(obj, bone)


def smooth_points(points, slices):
    def catmull(a, b, c, d, t):
        return .5 * ((2 * b) + (-a + c) * t
                     + (2 * a - 5 * b + 4 * c - d) * t * t
                     + (-a + 3 * b - 3 * c + d) * t ** 3)

    for i in range(len(points) - 1):
        a, b, c, d = points[max(i - 1, 0)], points[i], points[i + 1], points[min(i + 2, len(points) - 1)]
        for frame in range(slices):
            yield tuple(catmull(*axis, frame / slices) for axis in zip(a, b, c, d))
    yield points[-1]


def body_weights(x):
    # Linear blends between bone centres keep the root, neck and tail continuous.
    centres = (
        (-3.77, "tail.04"), (-3.00, "tail.03"), (-2.29, "tail.02"), (-1.56, "tail.01"),
        (-.87, "root"), (.79, "root"), (1.44, "neck"), (1.80, "neck"), (2.17, "head"),
    )
    if x <= centres[0][0]:
        return (("tail.04", 1),)
    for (a, first), (b, second) in zip(centres, centres[1:]):
        if x <= b:
            if first == second:
                return ((first, 1),)
            t = (x - a) / (b - a)
            return ((first, 1 - t), (second, t))
    return (("head", 1),)


def torso():
    # Each profile defines x, centre height, horizontal radius and vertical radius.
    profiles = [
        (-3.94, 1.51, .018, .020),
        (-3.60, 1.44, .050, .065),
        (-3.17, 1.37, .099, .113),
        (-2.66, 1.32, .139, .159),
        (-2.20, 1.29, .207, .206),
        (-1.75, 1.29, .315, .271),
        (-1.35, 1.25, .509, .432),
        (-.92, 1.23, .755, .631),
        (-.42, 1.21, .821, .696),
        (.13, 1.16, .764, .641),
        (.63, 1.11, .620, .548),
        (1.06, 1.07, .443, .408),
        (1.44, 1.00, .283, .291),
        (1.79, .94, .185, .218),
        (2.05, .88, .157, .169),
        (2.14, .86, .075, .078),
    ]
    ring_size = 40
    vertices, blends = [], []
    rings = list(smooth_points(profiles, 8))
    for x, z, width, height in rings:
        for side in range(ring_size):
            angle = math.tau * side / ring_size
            vertices.append((x, max(.015, width) * math.cos(angle), z + max(.015, height) * math.sin(angle)))
            blends.append(body_weights(x))
    faces = []
    for ring in range(len(rings) - 1):
        for side in range(ring_size):
            this, following = ring * ring_size + side, ring * ring_size + (side + 1) % ring_size
            faces.append((this, following, following + ring_size, this + ring_size))
    faces += [tuple(reversed(range(ring_size))), tuple(range(len(vertices) - ring_size, len(vertices)))]
    obj = mesh("Continuous skin · torso neck and tail", vertices, faces, [skin, belly], weights=blends)
    paint(obj.data, skin_pigment)
    for poly in obj.data.polygons:
        # Underside material follows each local oval instead of a fixed height.
        angles = [math.sin(math.tau * (i % ring_size) / ring_size) for i in poly.vertices]
        poly.material_index = int(sum(angles) / len(angles) < -.61)


def spike(name, start, bend, end, width, bone):
    start, bend, end = Vector(start), Vector(bend), Vector(end)
    vertices, faces = [], []
    segments, around = 9, 12
    for row in range(segments):
        t = row / (segments - 1)
        center = (1 - t) ** 2 * start + 2 * t * (1 - t) * bend + t * t * end
        tangent = 2 * (1 - t) * (bend - start) + 2 * t * (end - bend)
        normal = tangent.normalized().cross(Vector((1, 0, 0))).normalized()
        binormal = tangent.normalized().cross(normal).normalized()
        radius = max(.004, width * (1 - t) ** 1.05)
        for i in range(around):
            angle = math.tau * i / around
            vertices.append(tuple(center + radius * (math.cos(angle) * normal + math.sin(angle) * binormal)))
    for row in range(segments - 1):
        for i in range(around):
            a = row * around + i
            b = row * around + (i + 1) % around
            faces.append((a, b, b + around, a + around))
    faces += [tuple(reversed(range(around))), tuple(range(len(vertices) - around, len(vertices)))]
    mesh(name, vertices, faces, [horn], bone=bone)


def blade(i, x, y, base, width, height, bone, far_side):
    # Broad asymmetric silhouettes with a fleshy, cambered centre and thin rims.
    outline = [
        (-.36, .02), (-.52, .18), (-.53, .45), (-.37, .76),
        (-.14, .97), (.05, 1.02), (.22, .86), (.42, .62),
        (.54, .33), (.44, .13), (.24, .01), (0, -.04),
    ]
    outline = list(smooth_points(outline + outline[:1], 2))[:-1]
    thickness = max(.037, min(.12, width * .11))
    lean = -.20 if y < 0 else .20
    ring = len(outline)
    vertices = []
    profile = ((thickness * .78, .42), (thickness / 2, .87), (thickness * .14, 1),
               (-thickness * .14, 1), (-thickness / 2, .87), (-thickness * .78, .42))
    for depth, shrink in profile:
        for along, up in outline:
            up = .37 + (up - .37) * shrink
            vertices.append((x + (along * shrink - up * .095) * width, y + depth + lean * up * height, base + up * height))
    vertices += [(x - .04 * width, y + thickness * .84 + lean * .42 * height, base + .42 * height),
                 (x - .04 * width, y - thickness * .84 + lean * .42 * height, base + .42 * height)]
    faces = []
    for layer in range(len(profile) - 1):
        for v in range(ring):
            following = (v + 1) % ring
            faces.append((layer * ring + v, layer * ring + following, (layer + 1) * ring + following, (layer + 1) * ring + v))
    for v in range(ring):
        following = (v + 1) % ring
        faces.append((len(vertices) - 2, following, v))
        faces.append((len(vertices) - 1, (len(profile) - 1) * ring + v, (len(profile) - 1) * ring + following))
    obj = mesh(f"Back plate {i:02d} · {'far' if far_side else 'near'}", vertices, faces,
               [plate, rim], bone=bone)
    for polygon in list(obj.data.polygons)[ring:4 * ring]:
        polygon.material_index = 1
    root_color, face_color, highlight = map(pigment, ("7D3D22", "BB4F2B", "D68236"))

    def plate_pigment(vertex):
        up = (vertex.z - base) / height
        along = (vertex.x - x) / width
        color = blend_color(root_color, face_color, max(0, min(1, (up - .10) * 1.8)))
        ray = max(0, math.cos(12 * math.atan2(along + .08, up + .1))) ** 3
        return blend_color(color, highlight, ray * max(0, min(.8, up + .26)))

    paint(obj.data, plate_pigment)
    bevel = obj.modifiers.new("Smooth plate camber", "SUBSURF")
    bevel.levels = 1
    bevel.render_levels = 1


def leg_skin(name, pivots, bones, hind):
    (hx, hy, hz), (kx, ky, kz), (ax, ay, az) = pivots
    top, down, foot = bones
    profiles = (
        (hx, hy, hz + .29, .035, .035),
        (hx, hy, hz + .09, .37 if hind else .25, .30 if hind else .207),
        (hx + .045, hy, hz - .14, .40 if hind else .264, .31 if hind else .212),
        (kx - .055, ky, kz + .054, .25 if hind else .184, .204 if hind else .152),
        (kx - .022, ky, kz - .083, .225 if hind else .163, .176 if hind else .134),
        (ax + .035, ay, az + .077, .175 if hind else .137, .148 if hind else .120),
        (ax + .050, ay, az - .055, .136 if hind else .126, .133 if hind else .108),
    )
    rings = list(smooth_points(profiles, 4))
    ring_size = 24
    vertices, blends = [], []
    for x, y, z, width, depth in rings:
        upper = max(0, min(1, (z - kz + .155) / .335))
        base = max(0, min(1, (az + .075 - z) / .145))
        for side in range(ring_size):
            a = math.tau * side / ring_size
            vertices.append((x + width * math.cos(a), y + depth * math.sin(a), z))
            blends.append(((top, upper), (down, 1 - upper - base), (foot, base)))
    faces = []
    for ring in range(len(rings) - 1):
        for side in range(ring_size):
            here = ring * ring_size + side
            following = ring * ring_size + (side + 1) % ring_size
            faces.append((here, here + ring_size, following + ring_size, following))
    obj = mesh(name, vertices, faces, [skin], weights=blends)
    paint(obj.data, skin_pigment)


torso()
plate_profile = [
    (1.37, 1.21, .40, .33, "neck"),
    (1.01, 1.42, .51, .53, "root"),
    (.58, 1.60, .62, .70, "root"),
    (.12, 1.74, .72, .90, "root"),
    (-.39, 1.81, .80, 1.02, "root"),
    (-.99, 1.74, .74, .89, "root"),
    (-1.51, 1.61, .58, .63, "tail.01"),
    (-1.92, 1.45, .42, .42, "tail.02"),
    (-2.28, 1.43, .28, .26, "tail.02"),
]
for index, (x, base, width, height, bone) in enumerate(plate_profile):
    blade(index + 1, x, -.26, base, width, height, bone, False)
    if index > 0:
        blade(index + 10, x + .21, .25, base + .005, width * .89, height * .86, bone, True)
for group, (x, z, bone) in enumerate(((-3.13, 1.37, "tail.03"), (-3.56, 1.48, "tail.04"))):
    for sign in (-1, 1):
        inset, reach, raised = .18, (.53 if group == 0 else .47), (.62 if group == 0 else .53)
        spike(f"Tail spike {group + 1} · {sign}", (x, sign * .075, z),
              (x - inset, sign * reach * .69, z + raised * .49),
              (x - inset - .13, sign * reach, z + raised), .117 if group == 0 else .096, bone)

for (limb, side), (names, pivots) in LEGS.items():
    foot = names[-1]
    ankle = pivots[-1]
    hind = limb == "hind"
    leg_skin(f"{limb.capitalize()} {side} · connected leg", pivots, names, hind)
    sphere(f"{limb.capitalize()} {side} · padded foot", (ankle[0] + .07, ankle[1], .132),
           ((.31 if hind else .27), (.21 if hind else .17), .135), dark_skin, foot)
    for i in range(3):
        y = ankle[1] + (i - 1) * (.11 if hind else .09)
        sphere(f"{limb.capitalize()} {side} · digit {i+1}", (ankle[0] + .277 - abs(i-1)*.027, y, .10),
               (.100, .077, .082), skin, foot, detail=0)
        sphere(f"{limb.capitalize()} {side} · keratin cap {i+1}", (ankle[0] + .330 - abs(i-1)*.027, y, .088),
               (.064, .054, .048), horn, foot, detail=0)

sphere("Head · skull", (2.002, 0, .96), (.347, .255, .238), skin, "head")
sphere("Head · muzzle", (2.215, 0, .827), (.292, .174, .150), skin, "head")
sphere("Head · beak and upper mouth", (2.405, 0, .799), (.126, .151, .091), beak, "head")
sphere("Head · lower lip", (2.292, 0, .750), (.181, .144, .064), belly, "head")
for side in (-1, 1):
    sphere(f"Eye socket {side}", (2.122, .202 * side, 1.044), (.12, .069, .084), dark_skin, "head")
    sphere(f"Eye orange iris {side}", (2.139, .252 * side, 1.043), (.067, .030, .056), iris, "head")
    sphere(f"Eye pupil {side}", (2.153, .273 * side, 1.043), (.026, .014, .040), pupil, "head")
    sphere(f"Eye catchlight {side}", (2.153, .285 * side, 1.066), (.015, .007, .013), glint, "head", detail=0)
    sphere(f"Supraorbital ridge {side}", (2.095, .197 * side, 1.110), (.142, .074, .049), skin, "head")
    sphere(f"Nostril {side}", (2.377, .130 * side, .856), (.038, .016, .022), beak, "head", detail=0)
    sphere(f"Cheek ridge {side}", (2.032, .219 * side, .859), (.155, .040, .071), belly, "head")


def set_rotation(name, rx=0, ry=0, rz=0):
    rest = REST[name]
    bone = rig.pose.bones[name]
    bone.rotation_mode = "QUATERNION"
    bone.rotation_quaternion = rest.inverted() @ Euler((rx, ry, rz), "XYZ").to_quaternion() @ rest


def solve_leg(names, pivots, stride, lift, root_shift, root_pitch):
    top, down, foot = names
    hip, knee, ankle = [Vector(p) for p in pivots]
    desired = ankle + Vector((stride, 0, lift)) - root_shift
    goal = Quaternion((0, 1, 0), -root_pitch) @ desired
    a = Vector((hip.x, hip.z))
    b = Vector((knee.x, knee.z))
    c = Vector((ankle.x, ankle.z))
    t = Vector((goal.x, goal.z))
    upper, lower = (b - a).length, (c - b).length
    direction = (t - a).normalized()
    distance = min(upper + lower - .002, max(.01, (t - a).length))
    along = (upper ** 2 - lower ** 2 + distance ** 2) / (2 * distance)
    cross = math.sqrt(max(0, upper ** 2 - along ** 2))
    perpendicular = Vector((-direction.y, direction.x))
    if (b - a).dot(perpendicular) < 0:
        perpendicular.negate()
    hinge = a + direction * along + perpendicular * cross
    target = a + direction * distance

    def angle(v):
        return math.atan2(v.x, v.y)

    upper_delta = angle(hinge - a) - angle(b - a)
    lower_delta = angle(target - hinge) - angle(c - b) - upper_delta
    set_rotation(top, ry=upper_delta)
    set_rotation(down, ry=lower_delta)
    set_rotation(foot, ry=-upper_delta - lower_delta - root_pitch)


def ease(t):
    return t * t * (3 - 2 * t)


def envelope(phase, points):
    for (a, value_a), (b, value_b) in zip(points, points[1:]):
        if phase <= b:
            return value_a + (value_b - value_a) * ease((phase - a) / (b - a))
    return points[-1][1]


def animation_pose(clip, index, frames):
    phase = index / (frames - 1)
    cycle = math.tau * index / frames
    shadow_yaw = 0.05 * math.sin(cycle)
    tail_pitch = 0.015 * math.cos(cycle)
    neck_pitch = 0.02 * math.sin(cycle)
    head_pitch = 0.02 * math.cos(cycle)
    root_shift = Vector((0, 0, .011 * math.sin(cycle)))
    root_pitch = .013 * math.sin(cycle)
    root_yaw = 0
    turn_progress = 0
    if clip == "threat":
        tension = envelope(phase, ((0, 0), (.35, 1), (.83, .93), (1, .75)))
        shadow_yaw = -.42 * tension
        tail_pitch = .29 * tension
        root_shift = Vector((-.02, 0, -.105 * tension))
        root_pitch = .069 * tension
        neck_pitch = .17 * tension
        head_pitch = -.06 * tension
    elif clip == "attack":
        shadow_yaw = envelope(phase, ((0, -.32), (.28, -.54), (.55, 1.05), (.72, .68), (1, .06)))
        tail_pitch = envelope(phase, ((0, .22), (.30, .24), (.59, -.11), (1, 0)))
        lean = envelope(phase, ((0, .7), (.28, 1), (.60, .3), (1, 0)))
        root_shift = Vector((-.118 * lean, 0, -.105 * lean))
        root_pitch = .095 * lean
        neck_pitch = .14 * lean
        head_pitch = -.05 * lean
    elif clip == "react":
        recoil = envelope(phase, ((0, 0), (.25, 1), (.65, .36), (1, 0)))
        shadow_yaw = .34 * recoil
        tail_pitch = -.13 * recoil
        root_shift = Vector((-.155 * recoil, 0, -.071 * recoil))
        root_pitch = -.18 * recoil
        neck_pitch = -.12 * recoil
        head_pitch = .18 * recoil
    elif clip in ("walk", "retreat"):
        root_shift.z = .024 * math.cos(2 * cycle)
        root_pitch = .022 * math.sin(cycle)
        shadow_yaw = (.145 if clip == "walk" else .22) * math.sin(cycle)
        neck_pitch = .058 * math.sin(cycle)
    elif clip == "turn":
        turn_progress = (index + 1) / (frames + 1)
        turn_weight = math.sin(math.pi * turn_progress)
        # When the viewer mirrors the sprite, its off-centre ground point also
        # moves. Match that point at both ends while keeping depth fixed.
        slide = -.41 * (1 - turn_progress)
        root_shift = Vector((slide, slide, -.041 * turn_weight))
        root_yaw = -math.pi / 2 * (1 - turn_progress)
        root_pitch = .030 * turn_weight
        shadow_yaw = -.23 * turn_weight
        tail_pitch = .067 * turn_weight
        neck_pitch = .065 * turn_weight
        head_pitch = -.035 * turn_weight

    set_rotation("root", ry=root_pitch, rz=root_yaw)
    rig.pose.bones["root"].location = REST["root"].inverted() @ root_shift
    set_rotation("neck", ry=neck_pitch)
    set_rotation("head", ry=head_pitch)
    for i, (yaw, pitch) in enumerate(zip((.46, .29, .16, .09), (.46, .25, .18, .11)), 1):
        set_rotation(f"tail.{i:02d}", ry=tail_pitch * pitch, rz=shadow_yaw * yaw)
    for (limb, side), (names, pivots) in LEGS.items():
        stride, lift = 0, 0
        if clip in ("walk", "retreat"):
            offset = 0 if (limb == "fore") == (side == "near") else math.pi
            if limb == "hind":
                offset += .49
            gait = cycle + offset
            stride = (.245 if limb == "fore" else .295) * math.cos(gait)
            if clip == "retreat":
                stride *= -.83
            lift = max(0, math.sin(gait)) ** 1.45 * (.138 if limb == "fore" else .173)
        elif clip == "threat" and limb == "fore":
            stride = .061 * envelope(phase, ((0, 0), (.35, .95), (.85, .95), (1, .77)))
        elif clip == "attack":
            stride = (.075 if limb == "fore" else -.044) * math.sin(math.pi * phase)
        elif clip == "turn":
            support = 1 if (limb == "fore") == (side == "near") else -1
            step = math.sin(math.tau * turn_progress) * support
            stride = .116 * step
            lift = .105 * max(0, step)
        leg_shift = Vector((0, 0, root_shift.z)) if clip == "turn" else root_shift
        solve_leg(names, pivots, stride, lift, leg_shift, root_pitch)


clips = (("idle", 8), ("walk", 12), ("threat", 10), ("attack", 12), ("react", 8), ("retreat", 10), ("turn", 4))
frame = 1
for clip, length in clips:
    scene.timeline_markers.new(clip.title(), frame=frame)
    for index in range(length):
        animation_pose(clip, index, length)
        for bone in rig.pose.bones:
            bone.keyframe_insert("rotation_quaternion", frame=frame, group=bone.name)
        rig.pose.bones["root"].keyframe_insert("location", frame=frame, group="root")
        frame += 1
rig.animation_data.action.name = "Stegosaurus · idle walk threat attack react retreat turn"
scene.frame_end = frame - 1
scene.render.fps = 12

camera_data = bpy.data.cameras.new("Park isometric 2:1")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 7.38
camera = bpy.data.objects.new("Park isometric 2:1", camera_data)
scene.collection.objects.link(camera)
aim = Vector((-.41, 0, 1.56))
camera.location = aim + Vector((7, -7, 5.715))
camera.rotation_euler = (aim - camera.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = camera


def light(name, light_type, position, energy, color, size):
    data = bpy.data.lights.new(name, light_type)
    data.energy = energy
    data.color = color
    if light_type == "AREA":
        data.shape = "DISK"
        data.size = size
    else:
        data.angle = math.radians(size)
    source = bpy.data.objects.new(name, data)
    scene.collection.objects.link(source)
    source.location = position
    source.rotation_euler = (-source.location).to_track_quat("-Z", "Y").to_euler()


light("Key · warm late morning", "SUN", (-4.7, -5.0, 9), 2.48, (1, .95, .84), 12)
light("Fill · ground bounce", "AREA", (5, -5, 2.2), 175, (1, .91, .73), 5)
light("Rim · afternoon bounce", "AREA", (-2, 5, 4), 112, (1, .89, .74), 4)
world = bpy.data.worlds.new("Open soft daylight")
world.use_nodes = True
world.node_tree.nodes.get("Background").inputs["Color"].default_value = (.90, .95, 1, 1)
world.node_tree.nodes.get("Background").inputs["Strength"].default_value = .23
scene.world = world

scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.resolution_x = 384
scene.render.resolution_y = 320
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = .48
rig.show_in_front = False
scene.frame_set(1)
bpy.ops.object.select_all(action="DESELECT")
rig.select_set(True)
bpy.context.view_layer.objects.active = rig

args = sys.argv[sys.argv.index("--") + 1:]
out, frames = map(lambda value: Path(value).resolve(), args[:2])
frames.mkdir(parents=True, exist_ok=True)
out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out))
if "--preview" in args or "--turn-only" in args:
    samples = range(scene.frame_end - 3, scene.frame_end + 1) if "--turn-only" in args else (1, 31, 37)
    for sample in samples:
        scene.frame_set(sample)
        scene.render.filepath = str(frames / f"{sample:04d}.png")
        bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = str(frames) + "/"
    bpy.ops.render.render(animation=True)
