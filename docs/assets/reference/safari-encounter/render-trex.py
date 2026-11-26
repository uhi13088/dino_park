"""Build, rig, and render the editable T. rex for Dino Park's encounter sample.

Run with Blender in background mode, with optional flags after --:
  --output PATH  save the editable .blend
  --frames PATH  render 384×320 RGBA frames for 192×160 game-cell export
  --samples N    override the default preview render sample count
"""
from argparse import ArgumentParser
from math import cos, pi, sin
from pathlib import Path
import sys

import bpy
from mathutils import Quaternion, Vector
from bpy_extras.object_utils import world_to_camera_view


parser = ArgumentParser()
parser.add_argument("--output", type=Path)
parser.add_argument("--frames", type=Path)
parser.add_argument("--samples", type=int, default=8)
parser.add_argument("--still", type=int)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
parts = []


def srgba(hex_value):
    def linear(byte):
        value = byte / 255
        return value / 12.92 if value < .04045 else ((value + .055) / 1.055) ** 2.4
    return (*[linear((hex_value >> shift) & 255) for shift in (16, 8, 0)], 1)


def solid(name, color, roughness=.54):
    material = bpy.data.materials.new(name)
    material.diffuse_color = srgba(color)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = material.diffuse_color
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def skin(name, colors, scale=9):
    material = solid(name, colors[1])
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = .65
    tex = nodes.new("ShaderNodeTexCoord")
    pattern = nodes.new("ShaderNodeTexNoise")
    pattern.inputs["Scale"].default_value = scale
    pattern.inputs["Detail"].default_value = 3.2
    links.new(tex.outputs["Generated"], pattern.inputs["Vector"])
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'X'
    wave.inputs["Scale"].default_value = 3.7
    wave.inputs["Distortion"].default_value = 7
    links.new(tex.outputs["Generated"], wave.inputs["Vector"])
    mottling = nodes.new("ShaderNodeMixRGB")
    mottling.inputs[0].default_value = .28
    links.new(pattern.outputs["Fac"], mottling.inputs[1])
    links.new(wave.outputs["Color"], mottling.inputs[2])
    ramp = nodes.new("ShaderNodeValToRGB")
    gradient = ramp.color_ramp
    gradient.elements[0].position = .19
    gradient.elements[0].color = srgba(colors[0])
    gradient.elements[1].position = .77
    gradient.elements[1].color = srgba(colors[2])
    gradient.elements.new(.51).color = srgba(colors[1])
    links.new(mottling.outputs["Color"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    scales = nodes.new("ShaderNodeTexVoronoi")
    scales.feature = 'DISTANCE_TO_EDGE'
    scales.inputs["Scale"].default_value = 48
    links.new(tex.outputs["Object"], scales.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = .08
    bump.inputs["Distance"].default_value = .014
    links.new(scales.outputs["Distance"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return material


back = skin("Olive scales", [0x545d38, 0x78874a, 0x939559])
belly = skin("Honey flank and underside", [0x947446, 0xc59e55, 0xe1bd70])
mask = skin("Rust facial markings", [0x7b402b, 0xa55933, 0xc87d46], 6.5)
dark = skin("Dark auburn palate", [0x251514, 0x442825, 0x603630], 10)
brow = solid("Olive brow ridges", 0x596436, .55)
lip = solid("Dark bronze lips", 0x55402d)
nail = solid("Horn and claws", 0x443b29, .48)
toe_skin = skin("Grounded olive toes", [0x5b5139, 0x7b7851, 0xa29b67], 6)
tooth = solid("Worn ivory enamel", 0xe4c69a, .42)
socket = solid("Deep umber eye surround", 0x39241d)
iris = solid("Amber iris", 0xef9431, .29)
pupil = solid("Dark round pupil", 0x19100c, .33)
glint = solid("Eye catchlight", 0xffe6b0, .24)


def paint_material():
    material = solid("Hand-painted olive and honey markings", 0x7a884a, .63)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    pigment = nodes.new("ShaderNodeVertexColor")
    pigment.layer_name = "Palette"
    pattern = nodes.new("ShaderNodeTexVoronoi")
    pattern.feature = 'DISTANCE_TO_EDGE'
    pattern.inputs["Scale"].default_value = 30
    tex = nodes.new("ShaderNodeTexCoord")
    links.new(tex.outputs["Object"], pattern.inputs["Vector"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = .27
    bump.inputs["Distance"].default_value = .031
    links.new(pattern.outputs["Distance"], bump.inputs["Height"])
    shader = nodes.get("Principled BSDF")
    links.new(pigment.outputs["Color"], shader.inputs["Base Color"])
    links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return material


painted = paint_material()
olive, moss = srgba(0x81944a), srgba(0x3e572f)
honey, cream = srgba(0xe3ae52), srgba(0xf1c778)
rust = srgba(0xb85e32)


def mix(a, b, weight):
    return tuple(left + (right - left) * weight for left, right in zip(a, b))


def feather(low, high, value):
    amount = max(0, min(1, (value-low) / (high-low)))
    return amount*amount*(3-2*amount)


body_bands = [(-3.00,.113),(-2.58,.115),(-2.07,.139),(-1.53,.165),(-.89,.200),
              (-.205,.251),(.524,.223),(1.132,.120)]


def body_pigment(section, _point, angle):
    upper = sin(angle)
    x = section.x
    c = mix(olive, srgba(0xa4a963), feather(.3,1,upper)*.48)
    bend = .24 * (1-upper)**2 + .065*sin(angle*3 + x*2.1)
    width_factor = 1 - .38*(1-upper)
    stripe = max(1-feather(.68,1.16,abs(x-center+bend)/(width * max(.45,width_factor)))
                 for center,width in body_bands)
    c = mix(c, moss, stripe * feather(-.52,-.25,upper))
    jawline = -.33 + .095*sin(x*2.65) + .036*sin(x*5.7)
    return mix(c, honey, 1-feather(jawline-.045,jawline+.11,upper))


def head_pigment(section, point, angle):
    x = section.x
    upper = sin(angle)
    c = mix(olive, srgba(0x9b9e64), feather(.08,.85,upper)*.55)
    marks = max(1-feather(.055,.116,abs(x-center + .15*(1-upper))) for center in (1.47,2.03,2.36))
    c = mix(c,moss,marks*feather(-.45,.03,upper)*.83)
    c = mix(c,rust,(1-feather(.53,1,((point.x-1.73)/.38)**2 + ((point.z-2.59)/.23)**2))*.82)
    return mix(c,honey,(1-feather(-.60,-.19,upper))*.85)


def jaw_pigment(section, _point, angle):
    c = mix(honey, cream, .46 + .26*sin(section.x*3.1))
    c = mix(c, rust, feather(.29,.67,sin(angle))*.72)
    return c


def leg_pigment(_section, point, angle):
    c = mix(olive, honey, (1-feather(-.52,-.20,sin(angle)))*.38)
    center = abs((point.z + .45 * point.x + .036*sin(3*angle)) % .38 - .19)
    stripe = (1-feather(.048,.084,center)) * feather(.43,.66,point.z)
    return mix(c,moss,stripe*.88)


def mesh_object(name, vertices, faces, materials, bone_weights, face_material=None):
    geometry = bpy.data.meshes.new(name)
    geometry.from_pydata(vertices, [], faces)
    geometry.update()
    obj = bpy.data.objects.new(name, geometry)
    scene.collection.objects.link(obj)
    for material in materials:
        geometry.materials.append(material)
    for polygon in geometry.polygons:
        polygon.use_smooth = True
        if face_material is not None:
            polygon.material_index = face_material[polygon.index]
    for bone, weights in bone_weights.items():
        group = obj.vertex_groups.new(name=bone)
        for index, weight in weights:
            if weight > .0001:
                group.add([index], weight, 'REPLACE')
    parts.append(obj)
    return obj


def catmull(p0, p1, p2, p3, t):
    return .5 * ((2 * p1) + (-p0 + p2) * t + (2*p0 - 5*p1 + 4*p2 - p3) * t*t
                 + (-p0 + 3*p1 - 3*p2 + p3) * t*t*t)


def tube(name, controls, materials, bind, subdivisions=4, sides=24, belly_edge=-.42, pigment=None):
    # Each section supplies x, y, z and two radii. A unified skin bends across joints.
    sections = [Vector(section) for section in controls]
    rings = []
    for index in range(len(sections) - 1):
        a, b = sections[index:index + 2]
        previous = sections[max(0, index - 1)]
        following = sections[min(len(sections) - 1, index + 2)]
        for step in range(subdivisions):
            rings.append(catmull(previous, a, b, following, step/subdivisions))
    rings.append(sections[-1])
    vertices, faces, surface, weights, colors = [], [], [], {}, []
    for index, value in enumerate(rings):
        center = Vector(value[:3])
        axis = Vector(rings[min(index + 1, len(rings) - 1)][:3]) - Vector(rings[max(0, index - 1)][:3])
        axis.normalize()
        across = Vector((0, 1, 0))
        normal = axis.cross(across).normalized()
        across = normal.cross(axis).normalized()
        assignment = bind(center) if callable(bind) else {bind: 1}
        for side in range(sides):
            radians = 2 * pi * side / sides
            point = center + across * (cos(radians) * max(.005, value[3])) + normal * (sin(radians) * max(.005, value[4]))
            for bone, weight in assignment.items():
                weights.setdefault(bone, []).append((len(vertices), weight))
            vertices.append(point)
            if pigment:
                colors.append(pigment(center, point, radians))
    for i in range(len(rings)-1):
        for j in range(sides):
            following = (j + 1) % sides
            faces.append((i*sides+j, i*sides+following, (i+1)*sides+following, (i+1)*sides+j))
            surface.append(int(len(materials)>1 and sin(2*pi*(j+.5)/sides) < belly_edge))
    faces.extend((tuple(reversed(range(sides))), tuple(range((len(rings)-1)*sides, len(rings)*sides))))
    surface.extend((0, 0))
    if pigment:
        obj = mesh_object(name, vertices, faces, [painted], weights)
        palette = obj.data.color_attributes.new(name="Palette", type='FLOAT_COLOR', domain='POINT')
        palette.data.foreach_set("color", [channel for color in colors for channel in color])
        return obj
    return mesh_object(name, vertices, faces, materials, weights, surface)


def blend_bind(axis, limits):
    for i, ((start, bone), (end, next_bone)) in enumerate(zip(limits, limits[1:])):
        if axis > end:
            continue
        t = max(0, min(1, (axis-start) / (end-start)))
        t = t*t*(3-2*t)
        return {bone:1-t, next_bone:t}
    return {limits[-1][1]:1}


def ellipsoid(name, center, radii, material, bind, rotation=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12)
    obj = bpy.context.object
    obj.name = name
    rotation = rotation or Quaternion()
    factor = Vector(radii)
    origin = Vector(center)
    for vertex in obj.data.vertices:
        v = vertex.co
        vertex.co = origin + rotation @ Vector((v.x*factor.x, v.y*factor.y, v.z*factor.z))
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.use_smooth = True
    obj.vertex_groups.new(name=bind).add(range(len(obj.data.vertices)), 1, 'REPLACE')
    parts.append(obj)
    return obj


def spike(name, start, end, radius, material, bone):
    p0, p2 = Vector(start), Vector(end)
    p1 = p0.lerp(p2, .48) + Vector((-.014, 0, 0))
    points = [(*p0, radius, radius*.86), (*p1, radius*.62, radius*.53), (*p2, .004, .004)]
    return tube(name, points, [material], bone, subdivisions=3, sides=9)


# Body is one continuous mesh from tail to the crest of the heavy neck.
tube("Body · weighted scales", [
    (-3.55,0,1.06,.008,.008),(-3.23,0,1.09,.055,.058),(-2.86,0,1.17,.11,.12),
    (-2.37,0,1.30,.16,.18),(-1.89,0,1.46,.23,.23),(-1.39,0,1.66,.33,.30),
    (-.93,0,1.76,.46,.39),(-.50,0,1.75,.56,.57),(-.03,0,1.76,.59,.61),(.40,0,1.74,.52,.57),
    (.73,0,1.81,.43,.53),(1.00,0,1.99,.35,.43),(1.23,0,2.24,.30,.35),
    (1.46,0,2.38,.26,.31),(1.55,0,2.42,.19,.22),(1.63,0,2.43,.022,.027),
], [back, belly], lambda p: blend_bind(p.x, [(-3.10,"tail_tip"),(-2.24,"tail_mid"),
    (-1.22,"tail_root"),(-.25,"pelvis"),(.5,"chest"),(1.21,"neck"),(1.55,"skull")]),
    subdivisions=8, sides=32, pigment=body_pigment)
tube("Upper skull · sculpted snout", [
    (1.10,0,2.34,.02,.02),(1.26,0,2.39,.21,.23),(1.48,0,2.45,.36,.36),
    (1.70,0,2.48,.39,.37),(1.96,0,2.47,.35,.31),(2.24,0,2.43,.29,.27),
    (2.48,0,2.43,.24,.225),(2.62,0,2.43,.15,.16),(2.66,0,2.43,.025,.04),
], [back,mask], "skull", subdivisions=8, sides=32, pigment=head_pigment)
tube("Lower jaw · sculpted", [
    (1.26,0,2.22,.02,.035),(1.47,0,2.07,.28,.155),(1.73,0,2.01,.30,.16),
    (2.00,0,2.015,.265,.134),(2.26,0,2.04,.226,.116),(2.48,0,2.075,.199,.103),
    (2.63,0,2.11,.114,.059),(2.67,0,2.11,.02,.019),
], [mask,belly], "jaw", pigment=jaw_pigment)
ellipsoid("Palate", (1.99,0,2.20),(.57,.265,.078),dark,"skull")
ellipsoid("Mouth interior", (1.99,0,2.068),(.57,.23,.071),dark,"jaw")
ellipsoid("Tongue", (2.03,0,2.105),(.39,.137,.040),mask,"jaw")

for side in (-1,1):
    label = "R" if side == -1 else "L"
    ellipsoid(f"Orbital muscle {label}", (1.58,side*.282,2.53),(.198,.104,.154),mask,"skull")
    ellipsoid(f"Eyesocket {label}", (1.642,side*.405,2.527),(.109,.027,.089),socket,"skull")
    ellipsoid(f"Eye {label}", (1.665,side*.425,2.526),(.066,.023,.052),iris,"skull")
    ellipsoid(f"Pupil {label}", (1.682,side*.443,2.526),(.027,.010,.037),pupil,"skull")
    ellipsoid(f"Eye highlight {label}", (1.665,side*.455,2.547),(.011,.004,.010),glint,"skull")
    ellipsoid(f"Brow ridge {label}", (1.677,side*.326,2.630),(.201,.102,.087),brow,"skull",
              Quaternion((0,1,0),-.15))
    ellipsoid(f"Cheek ridge {label}", (1.69,side*.306,2.31),(.231,.084,.090),belly,"skull",
              Quaternion((0,1,0),.27))
    ellipsoid(f"Snout edge {label}", (2.18,side*.263,2.36),(.386,.056,.071),back,"skull")
    ellipsoid(f"Naris {label}", (2.47,side*.232,2.463),(.050,.014,.028),socket,"skull")
    for i in range(9):
        x = 1.708 + i*.099
        y = (.321 - i*.013) * side
        top = 2.224 - .010 * (i > 5)
        size = [.075,.111,.124,.102,.115,.086,.095,.067,.048][i]
        spike(f"Upper tooth {label}{i+1}", (x,y,top+.028), (x-.032,y*.99,top-size),
              .027 if i < 6 else .023, tooth, "skull")
    for i in range(8):
        x = 1.760 + i*.105
        y = (.273 - i*.011) * side
        size = [.075,.092,.079,.088,.078,.067,.051,.031][i]
        spike(f"Lower tooth {label}{i+1}", (x,y,2.092),(x-.026,y,2.09+size),.019,tooth,"jaw")

    hip = (-.37,side*.425,1.72)
    knee = (.16,side*.51,.99)
    ankle = (-.19,side*.57,.23)
    leg_parts = [
      (*hip,.28,.32),(-.30,side*.50,1.59,.329,.312),(-.155,side*.515,1.43,.303,.275),
      (.02,side*.524,1.18,.204,.238),(*knee,.151,.183),
      (.064,side*.544,.75,.146,.138),(-.197,side*.57,.47,.092,.112),
      (*ankle,.075,.090),(-.177,side*.57,.16,.060,.060)
    ]
    tube(f"Hind leg {label}", leg_parts, [back, belly], lambda p:
         blend_bind(-p.z,[(-1.72,f"femur.{label}"),(-1.16,f"femur.{label}"),
                          (-.86,f"shin.{label}"),(-.31,f"shin.{label}"),(-.21,f"foot.{label}")]),
         subdivisions=8, sides=32, pigment=leg_pigment)
    ellipsoid(f"Muscular haunch {label}",(-.44,side*.405,1.53),(.46,.28,.503),back,f"femur.{label}",
              Quaternion((0,1,0),-.20))
    ellipsoid(f"Ankle pad {label}",(-.065,side*.564,.151),(.207,.138,.121),back,f"foot.{label}")
    for index, y_offset in enumerate((-.109,0,.109)):
        toe = .403 if index != 1 else .494
        toes_y = side*.566+y_offset
        tube(f"Pad {label}{index}", [
          (-.16,side*.566 + y_offset*.4,.171,.077,.078),(.075,toes_y*.99,.135,.059,.060),
          (.223,toes_y,.105,.047,.050),(toe-.046,toes_y*1.045,.069,.034,.036)
        ], [toe_skin], f"foot.{label}", sides=14)
        spike(f"Toe claw {label}{index}", (toe-.080,toes_y*1.04,.080),(toe,toes_y*1.045,.027),
              .038,nail,f"foot.{label}")

    tube(f"Forelimb {label}", [
        (.705,side*.326,1.677,.098,.104),(.79,side*.377,1.49,.080,.081),
        (.925,side*.409,1.46,.058,.061),(1.11,side*.405,1.58,.039,.044),
        (1.192,side*.404,1.598,.030,.036)
    ],[back,belly],f"arm.{label}",sides=16)
    for finger in range(2):
        y_at = side*.407 + (-.026 if finger else .021)
        spike(f"Forelimb claw {label}{finger}",(1.16,y_at,1.598),(1.30,y_at,1.560),
              .022,nail,f"arm.{label}")

for i in range(10):
    x = -1.92 + i*.31
    z = 2.29 - abs(x + .04)**1.5 * .269 + .046*sin(i*7)
    bone = max({"tail_root":max(0,-x-.5),"pelvis":max(0,1-abs(x+.24)),
                "chest":max(0,x+.2)}.items(),key=lambda p:p[1])[0]
    ellipsoid(f"Dorsal scales {i+1}",(x,0,z),(.112,.078,.043),back,bone)


# Original pose rig. Short editable actions share this geometry and its frame ranges.
armature = bpy.data.armatures.new("Dino Park T. rex rig")
rig = bpy.data.objects.new("Tyrannosaurus rex", armature)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
specs = [
 ("pelvis",(-.27,0,1.74),(.33,0,1.75),None),
 ("chest",(.20,0,1.75),(.84,0,1.93),"pelvis"),
 ("neck",(.78,0,1.90),(1.43,0,2.37),"chest"),
 ("skull",(1.42,0,2.36),(2.56,0,2.43),"neck"),
 ("jaw",(1.46,0,2.145),(2.56,0,2.12),"skull"),
 ("tail_root",(-.35,0,1.75),(-1.49,0,1.62),"pelvis"),
 ("tail_mid",(-1.49,0,1.62),(-2.44,0,1.28),"tail_root"),
 ("tail_tip",(-2.44,0,1.28),(-3.55,0,1.06),"tail_mid"),
]
for sign,label in ((-1,"R"),(1,"L")):
    hip = (-.37,sign*.425,1.72)
    knee = (.16,sign*.51,.99)
    ankle = (-.19,sign*.57,.23)
    specs.extend([
       (f"femur.{label}",hip,knee,"pelvis"),(f"shin.{label}",knee,ankle,f"femur.{label}"),
       (f"foot.{label}",ankle,(.50,sign*.57,.086),f"shin.{label}"),
       (f"arm.{label}",(.705,sign*.326,1.677),(1.192,sign*.404,1.598),"chest"),
    ])
for name, head, tail, parent in specs:
    bone = armature.edit_bones.new(name)
    bone.head, bone.tail = head, tail
    if parent:
        bone.parent = armature.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')

for obj in parts:
    obj.parent = rig
    deform = obj.modifiers.new("T. rex pose rig", "ARMATURE")
    deform.object = rig
    deform.use_deform_preserve_volume = True

for sign,label in ((-1,"R"),(1,"L")):
    ctrl = bpy.data.objects.new(f"Foot target {label}", None)
    scene.collection.objects.link(ctrl)
    ctrl.empty_display_type = 'SPHERE'
    ctrl.empty_display_size = .075
    ctrl.location = (-.19,sign*.57,.23)
    ik = rig.pose.bones[f"shin.{label}"].constraints.new("IK")
    ik.target = ctrl
    ik.chain_count = 2
    ik.iterations = 100
    ik.use_stretch = False
    # The foot target and ankle use the same world rotation reference.
    orientation = bpy.data.objects.new(f"Foot rest {label}", None)
    scene.collection.objects.link(orientation)
    orientation.rotation_mode = 'QUATERNION'
    orientation.rotation_quaternion = armature.bones[f"foot.{label}"].matrix_local.to_quaternion()
    orient = rig.pose.bones[f"foot.{label}"].constraints.new("COPY_ROTATION")
    orient.target = orientation
    orient.owner_space = 'WORLD'
    orient.target_space = 'WORLD'
    orient.mix_mode = 'REPLACE'


clips = [("idle",8),("walk",12),("threat",10),("attack",12),("react",8),("retreat",10)]
bone_map = {bone.name: bone for bone in rig.pose.bones}


def pose(frame, clip, i, count):
    epsilon = i / (count - 1)
    pulse = lambda end, center, width: end * max(0, 1-abs(epsilon-center)/width)**1.3
    period = 2*pi*i/max(1,count)
    sway, yaw, lower, mouth, recoil, lean, surge = .018*sin(period), 0, 0, .065, 0, 0, 0
    lift, stride = 0, 0
    if clip == "walk":
        lift, stride = .178, .35
        sway = .043*cos(period*2)
        yaw = .020*sin(period)
        lean = .035*sin(period)
    elif clip == "threat":
        lean = -pulse(.053,.45,.55)
        lower = -pulse(.228,.52,.56)
        mouth += pulse(.61,.57,.56)
        yaw = pulse(.095,.52,.52)
    elif clip == "attack":
        pre = pulse(1,.15,.29)
        launch = pulse(1,.55,.44)
        sway = -.10*pre-.11*launch
        mouth += .29*pre+.56*launch
        lower = .13*pre+.12*launch
        lean = -.10*pre+.115*launch
        surge = -.12*pre+.45*launch
        lift,stride=.085,.16
    elif clip == "react":
        recoil = pulse(1,.38,.54) + .47*pulse(1,1,.62)
        lean = -.095*recoil
        lower = -.34*recoil
        yaw = -.14*recoil
        mouth += .22*recoil
        surge = -.38*recoil
        sway = .056*recoil
        lift,stride=.13,.26
    elif clip == "retreat":
        sway = -.04+.051*cos(period*2)
        lift,stride = .16,-.325
        lower = -.103+.041*cos(period)
        lean=-.075
        yaw=.037*sin(period)
        mouth=.047
    def rotate(name, pitch=0, heading=0, roll=0):
        bone = bone_map[name]
        rest = bone.bone.matrix_local.to_quaternion()
        action = Quaternion((0,0,1),heading) @ Quaternion((0,1,0),pitch) @ Quaternion((1,0,0),roll)
        bone.rotation_mode = 'QUATERNION'
        bone.rotation_quaternion = rest.inverted() @ action @ rest
        bone.keyframe_insert("rotation_quaternion", frame=frame, group=name)

    rotate("pelvis", lean*.27, yaw*.24)
    root = bone_map["pelvis"]
    root.location = root.bone.matrix_local.to_quaternion().inverted() @ Vector((surge, .024*sin(period), sway))
    root.keyframe_insert("location", frame=frame, group="pelvis")
    rotate("chest", lean*.47, yaw*.34, .028*sin(period))
    rotate("neck", lower*.71+lean*.4, yaw*.58, .013*sin(period))
    rotate("skull", lower*.34, yaw*.48)
    rotate("jaw", mouth)
    rotate("tail_root", -lean*.57, -.072*sin(period)-yaw)
    rotate("tail_mid", -.032*cos(period), .142*sin(period-.85))
    rotate("tail_tip", -.035*cos(period-.65), .186*sin(period-1.4))
    for sign,label in ((-1,"R"),(1,"L")):
        step = period + (pi if sign == 1 else 0)
        swing = max(0,-cos(step))
        foot = bpy.data.objects[f"Foot target {label}"]
        foot.location = (-.19+stride*sin(step) + surge*.35, sign*.57, .23+lift*swing**1.7)
        foot.keyframe_insert("location", frame=frame)
        rotate(f"arm.{label}", -mouth*.13-.045*sin(step))
    scene.frame_set(frame)


frame = 1
for clip, count in clips:
    scene.timeline_markers.new(clip, frame=frame)
    for offset in range(count):
        pose(frame, clip, offset, count)
        frame += 1
scene.frame_start, scene.frame_end = 1, frame-1
scene.render.fps = 12
scene.frame_set(1)

camera_data = bpy.data.cameras.new("Park 2:1 orthographic")
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 7.4
camera = bpy.data.objects.new("Park 2:1 orthographic",camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
focus = Vector((0,0,0))
direction = Vector((7,-7,5.715))
camera.rotation_euler = (-direction).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x = 192
scene.render.resolution_y = 160
scene.render.resolution_percentage = 100
camera.location = direction
bpy.context.view_layer.update()
project_zero = world_to_camera_view(scene,camera,Vector())
camera.location = direction + Vector((0,0,1))
bpy.context.view_layer.update()
project_one = world_to_camera_view(scene,camera,Vector())
focus.z = ((1-119/160)-project_zero.y)/(project_one.y-project_zero.y)
camera.location = direction + focus


def area(name, position, color, power, size):
    source = bpy.data.lights.new(name,'AREA')
    source.energy, source.color, source.shape, source.size = power, color, 'DISK', size
    lamp = bpy.data.objects.new(name,source)
    scene.collection.objects.link(lamp)
    lamp.location = position
    lamp.rotation_euler = (Vector((0,0,1.38))-lamp.location).to_track_quat('-Z','Y').to_euler()


area("Warm key", (-3.1,-5.4,6.8), (1,.91,.77), 800, 2.72)
area("Open sky fill", (3.4,4.6,5.9), (.89,.96,1), 410, 4.4)
area("Front bounce", (4.8,-6.1,3.22), (1,.97,.90), 118, 4.2)
area("Sunlit rim", (-4.2,3.6,6.1), (1,.87,.67), 420, 3.1)
world = bpy.data.worlds.new("Warm open sky")
world.use_nodes = True
world.node_tree.nodes.get("Background").inputs["Color"].default_value = (.47,.62,.72,1)
world.node_tree.nodes.get("Background").inputs["Strength"].default_value = .22
scene.world = world
scene.render.engine = 'CYCLES'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 0
scene.cycles.transparent_max_bounces = 1
scene.render.use_persistent_data = True
scene.render.threads_mode = 'FIXED'
scene.render.threads = 4
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.render.resolution_percentage = 200
bpy.context.preferences.filepaths.save_version = 0

# Preserve one clear camera framing when the project is opened for editing.
for screen in bpy.data.screens:
    for view in (area for area in screen.areas if area.type == 'VIEW_3D'):
        view.spaces.active.region_3d.view_perspective = 'CAMERA'
if args.output:
    args.output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.output.resolve()))
if args.frames:
    args.frames.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(args.frames.resolve() / "trex-")
    if args.still:
        scene.frame_set(args.still)
        scene.render.filepath += f"{args.still:04}.png"
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)
