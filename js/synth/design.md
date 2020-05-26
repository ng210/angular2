# ASU editor

## ASU format
ASU stands for adapter-sequence-user data block. This format describes sequenced commands to manipulate objects (devices) through adapters.

### Adapter
- creates devices
- creates necessary resources
- interface between player and device

### Sequence
- set of commands synchronized to frames
- the "entry point" is the 1st (master) sequence that controls the player itself

A sequence assigned to a device via an adapter creates a channel.

### User data block
- stores user standard or defined data organized in blocks
- a block can be referenced by any adapter or device
- examples are
  - adapter initialization
  - device initialization
  - command parameters

## Functions
The editor needs to support the ASU format, thus create/edit/remove adapters, sequences and user data blocks.
Adapters are located in a configurable _plug-in folder_ (settings).

### File
- new:
- load:
- save:
- settings:

### Edit
- cut:
- copy:
- paste:

### Playback
- bpm:
- start/stop:

### View
- devices:
- sequences:
- user data blocks:
