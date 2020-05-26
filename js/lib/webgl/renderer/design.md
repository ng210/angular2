# Rendering process
- iterate through pass types (opaque, translucent, transparent)
- select mesh by viewport culling, material (shader), texture, LOD

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
  - stores entities

# Repository

- repository items have a reference

## Scene
- passes
- meshes
- materials
- post processings

## Pass
- type
- selectors (material)
- target (framebuffer, render-target)

## Actor
- meshes
- bones/joints
- materials
- logic

## Mesh
- LOD
- vertices (VBO)
- indices (IBO)

## Material
- program
- texture
- parameters

## Program
- shaders
- uniforms

## Post processing
- source
- target
- shader
- resources

## Resource
- type (static, pre-generate, generate)

## Logic


# Process
- load repository
- repository items load/generate additional resources

- select scene
  - select pass by type
    - select mesh by
      - viewport culling
      - material
      - LOD
    - render pass to its target
- apply post-processing