# Rendering process
- iterate through pass types (opaque, translucent, transparent)
- select mesh
  - by LOD
  - by material (shader) and texture
- mesh selection is cached
  - define triggers to discard selection
- vertex data (VBO)
- parameters: uniforms (UBO)
- lights?
- shadows?
- ambient occlusion?
- post processing?

# Management
- math
- repository
  - fast queryable: indexed, sorted
  - items are
    - actors
    - meshes
    - materials: shaders(+textures?)
    - textures?
    - logic

# Structures

## Actors

## Meshes

## Materials