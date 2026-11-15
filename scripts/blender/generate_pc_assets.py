import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    parser = argparse.ArgumentParser(description="Generate generic PC component GLB assets")
    parser.add_argument("--part", choices=("gpu", "psu", "all"), default="all")
    parser.add_argument("--output", default="./pc-assets")
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return parser.parse_args(args)


def material(name, color, metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def cube(name, dimensions, location, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new("Manufactured edge radius", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.profile = 0.5
        obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        bpy.ops.object.modifier_apply(modifier="Weighted corner normals")
    return obj


def cylinder(name, radius, depth, location, mat, axis="Z", vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if axis == "Y":
        obj.rotation_euler[0] = math.pi / 2
    elif axis == "X":
        obj.rotation_euler[1] = math.pi / 2
    obj.data.materials.append(mat)
    return obj


def torus(name, major, minor, location, mat, axis="Z"):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=48, minor_segments=10, location=location)
    obj = bpy.context.object
    obj.name = name
    if axis == "Y":
        obj.rotation_euler[0] = math.pi / 2
    elif axis == "X":
        obj.rotation_euler[1] = math.pi / 2
    obj.data.materials.append(mat)
    return obj


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)


def export_part(name, output_dir):
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.scene.render.engine = "BLENDER_EEVEE"
    path = os.path.join(output_dir, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True)
    print("Exported", path)


def fan_on_gpu(x, y, z, index, materials):
    dark, blade, metal = materials
    cylinder("GPU fan frame %d" % index, 0.045, 0.004, (x, y, z), dark, vertices=48)
    torus("GPU fan rim %d" % index, 0.041, 0.0015, (x, y, z - 0.0025), metal)
    cylinder("GPU fan hub %d" % index, 0.012, 0.006, (x, y, z - 0.004), metal, vertices=32)
    for blade_index in range(9):
        angle = blade_index * math.tau / 9
        radius = 0.027
        obj = cube("GPU fan blade %d.%d" % (index, blade_index), (0.025, 0.009, 0.0018),
                   (x + math.cos(angle) * radius, y + math.sin(angle) * radius, z - 0.005), blade, 0.001)
        obj.rotation_euler[2] = angle + 0.45


def make_gpu(output_dir):
    clean_scene()
    shroud = material("Graphite polymer", (0.035, 0.043, 0.055), 0.12, 0.31)
    metal = material("Satin aluminum", (0.34, 0.38, 0.43), 0.82, 0.28)
    pcb = material("PCB", (0.012, 0.025, 0.018), 0.08, 0.55)
    gold = material("Connector gold", (0.72, 0.48, 0.12), 0.78, 0.24)
    fan = material("Fan blades", (0.09, 0.11, 0.14), 0.04, 0.4)
    black = material("Socket interiors", (0.006, 0.008, 0.01), 0.05, 0.65)

    length, depth, thickness = 0.30, 0.12, 0.055
    cube("GPU PCB", (length - 0.008, depth - 0.012, 0.002), (0, 0, 0), pcb, 0.001)
    cube("GPU backplate", (length - 0.004, depth - 0.006, 0.002), (0, 0, thickness / 2 - 0.003), metal, 0.001)
    cube("GPU cooler shroud", (length, depth, 0.008), (0, 0, -thickness / 2 + 0.006), shroud, 0.003)
    cube("GPU side rail", (length - 0.02, 0.004, 0.012), (0, depth / 2 - 0.002, 0), metal, 0.001)

    for index, x in enumerate((-0.088, 0.0, 0.088), 1):
        fan_on_gpu(x, 0, -thickness / 2 + 0.001, index, (black, fan, metal))

    cube("PCIe edge contact strip", (0.09, 0.002, 0.003), (0.015, 0, -thickness / 2 - 0.001), gold, 0.0004)
    cube("Rear I/O bracket", (0.0025, depth * 0.72, thickness + 0.008), (-length / 2 - 0.001, 0, 0), metal, 0.001)
    for port_index, y in enumerate((-0.033, -0.011, 0.011, 0.033), 1):
        cube("Display output %d surround" % port_index, (0.003, 0.014, 0.008), (-length / 2 - 0.003, y, -0.008), shroud, 0.001)
        cube("Display output %d opening" % port_index, (0.0035, 0.009, 0.004), (-length / 2 - 0.004, y, -0.008), black, 0.0005)

    for plug_index, x in enumerate((0.018, 0.044), 1):
        cube("GPU power socket %d" % plug_index, (0.022, 0.014, 0.004), (x, depth * 0.38, thickness / 2 + 0.002), black, 0.001)
        cube("GPU power plug %d" % plug_index, (0.019, 0.012, 0.009), (x, depth * 0.38, thickness / 2 + 0.008), shroud, 0.001)
        for pin in range(6):
            cylinder("GPU power contact %d.%d" % (plug_index, pin), 0.0007, 0.001,
                     (x - 0.006 + (pin % 3) * 0.006, depth * 0.38 - 0.003 + (pin // 3) * 0.006, thickness / 2 + 0.013), gold, vertices=8)

    for x in (-0.12, -0.04, 0.04, 0.12):
        cylinder("Backplate screw", 0.002, 0.001, (x, depth / 2 - 0.012, thickness / 2 + 0.002), gold, vertices=12)
    export_part("generic-gpu-detailed", output_dir)


def make_psu(output_dir):
    clean_scene()
    shell = material("Powder-coated steel", (0.055, 0.062, 0.073), 0.68, 0.34)
    dark = material("Recessed black", (0.009, 0.012, 0.016), 0.12, 0.48)
    metal = material("Brushed steel", (0.42, 0.46, 0.5), 0.82, 0.3)
    label = material("PSU specification label", (0.72, 0.74, 0.76), 0.0, 0.75)
    fan_mat = material("Fan polymer", (0.1, 0.12, 0.15), 0.05, 0.42)
    gold = material("Power contacts", (0.72, 0.48, 0.12), 0.78, 0.24)

    length, depth, height = 0.16, 0.15, 0.086
    cube("PSU housing", (length, depth, height), (0, 0, 0), shell, 0.003)
    face_y = depth / 2 + 0.001
    cylinder("PSU fan recess", 0.054, 0.002, (0, face_y, 0), dark, axis="Y", vertices=64)
    torus("PSU fan guard ring", 0.052, 0.0015, (0, face_y + 0.002, 0), metal, axis="Y")
    cylinder("PSU fan hub", 0.012, 0.004, (0, face_y + 0.003, 0), shell, axis="Y", vertices=32)
    for blade_index in range(9):
        angle = blade_index * math.tau / 9
        x = math.cos(angle) * 0.031
        z = math.sin(angle) * 0.031
        obj = cube("PSU fan blade %d" % blade_index, (0.026, 0.0015, 0.008), (x, face_y + 0.004, z), fan_mat, 0.001)
        obj.rotation_euler[1] = -angle + 0.45
    for angle in (0, math.pi / 4, math.pi / 2, 3 * math.pi / 4):
        x1, z1 = -0.046 * math.cos(angle), -0.046 * math.sin(angle)
        x2, z2 = 0.046 * math.cos(angle), 0.046 * math.sin(angle)
        start, end = Vector((x1, face_y + 0.004, z1)), Vector((x2, face_y + 0.004, z2))
        obj = cube("PSU fan grille spoke", (0.0018, 0.0018, (end - start).length), (0, 0, 0), metal)
        obj.location = (start + end) / 2
        obj.rotation_euler[1] = math.atan2(end.x - start.x, end.z - start.z)

    panel_x = length / 2 + 0.001
    cube("Modular connector panel", (0.002, 0.092, 0.064), (panel_x, -0.015, 0), dark, 0.002)
    for row, z in enumerate((0.018, -0.006, -0.03), 1):
        for column, y in enumerate((-0.031, -0.005, 0.021), 1):
            cube("Modular socket %d-%d" % (row, column), (0.004, 0.018, 0.014),
                 (panel_x + 0.002, y, z), shell, 0.001)
            cube("Socket opening %d-%d" % (row, column), (0.005, 0.012, 0.008),
                 (panel_x + 0.003, y, z), dark, 0.0005)
            for pin in range(4):
                cylinder("Modular contact %d-%d-%d" % (row, column, pin), 0.001, 0.001,
                         (panel_x + 0.006, y - 0.003 + (pin % 2) * 0.006, z - 0.002 + (pin // 2) * 0.004), gold, axis="X", vertices=8)
    cube("AC inlet surround", (0.004, 0.032, 0.024), (panel_x + 0.003, 0.048, 0.024), shell, 0.001)
    cube("AC inlet", (0.005, 0.022, 0.015), (panel_x + 0.005, 0.048, 0.024), dark, 0.001)
    cube("PSU identification label", (0.001, 0.075, 0.021), (0, -depth / 2 - 0.001, 0.021), label, 0.001)
    export_part("generic-psu-detailed", output_dir)


def main():
    args = parse_args()
    output_dir = os.path.abspath(args.output)
    os.makedirs(output_dir, exist_ok=True)
    if args.part in ("gpu", "all"):
        make_gpu(output_dir)
    if args.part in ("psu", "all"):
        make_psu(output_dir)


if __name__ == "__main__":
    main()
