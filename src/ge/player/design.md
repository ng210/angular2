# Player, adapter and sequence #

## 1. Sequence and adapter ##

### Dedicated sequences
* commands are pre-bound to adapter types
* command codes are reused
* requires transformation to be used by other adapter types

#Create sequence#
1. Add adapter A1
2. Add adapter A2
3. Add sequence S1 for A1
4. Add sequence S2 for A2
5. Add commands A1C1, A1C2, ..., A1Cn via A1
6. Add commands A2C1, A2C2, ... A2Cm via A2

#Playback#
1. Add adapter A1
2. Add adapter A2
3. Create channel CH1 as the bundle of sequence S1 and adapter A1
4. Create channel CH2 as the bundle of sequence S2 and adapter A2
5. CH1 reads commands A1C1, A1C2, ..., A1Cn from S1 and sends them to A1
6. CH2 reads commands A2C1, A2C2, ..., A2Cn from S2 and sends them to A2

### Generic sequences
* commands are registered by adapters
* commands share their codes (registration)

#Create sequence#
1. Add adapter A1, A1 registers its commands A1C1, A1C2, ..., A1Cn
2. Add adapter A2, A2 registers its commands A2C1, A2C2, ..., A2Cn
3. Add sequence S1
4. Add sequence S2
5. Add commands A1C1, A1C2, ..., A1Cn via A1
6. Add commands A2C1, A2C2, ... A2Cm via A2

#Playback#
1. Add adapter A1, A1 registers its commands A1C1, A1C2, ..., A1Cn
2. Add adapter A2, A2 registers its commands A2C1, A2C2, ..., A2Cn
3. Create channel CH1 for sequence S1
4. Create channel CH2 for sequence S2
5. CH1 reads commands A1C1, A1C2, ..., A1Cn, commands are sent to the registered adapter, that is A1
6. CH2 reads commands A2C1, A2C2, ..., A2Cm, commands are sent to the registered adapter, that is A2

Generic sequences allow mixed commands:
1. Add adapter A1, A1 registers its commands A1C1, A1C2, ..., A1Cn
2. Add adapter A2, A2 registers its commands A2C1, A2C2, ..., A2Cn
3. Add sequence S1
4. Add commands A1C1, A2C1, A1C2, A2C2, ..., A1Cn, A2Cm

1. Add adapter A1, A1 registers its commands A1C1, A1C2, ..., A1Cn
2. Add adapter A2, A2 registers its commands A2C1, A2C2, ..., A2Cn
3. Create channel CH1 for sequence S1
4. CH1 reads command A1C1, sends it to its registered adapter A1
5. CH1 reads command A2C1, sends it to its registered adapter A2

#The behaviour of an entity (target) is shaped by the adapter type and the commands coming from a sequence.#
#A channel is the association of a target, an adapter and sequence.#
#Adapters can process commands created for their type only. There is not a universal adapter type, that processes commands of different adapter types.#
#Sequences store commands specific to one particular adapter type. A target can be controlled by commands of multiple sequences of different adapter types.#
#Commands of a sequence of an adapter type A1 can be transformed to fit for adapter type A2.#
#An adapter and a sequence created for the adapter type of that adapter form a bundle and should be treated as one.

### Conclusion:Modified dedicated sequences ###
* sequences store a reference to their associated adapter types
* channels are not bound to adapter types, it is the association of a target and a sequence only


## 2. Entities, targets and adapters ##

Targets are entities controlled by commands processed by adapters. Entities can be created by the _Player-system_ and/or _externally_ by custom code.
The Player-system can create the entities _statically_ or _dynamically_.

### Create entities by the Player-system ###

Initializing the system includes adding singleton instances of the required adapter types. The adapters are responsible for creating the entities.

### Create entities externally ###

Adding targets to the system should include entities created outside of the system. This feature should be offered using callbacks.

### Create entities statically vs dynamically ###

At initialization all entities are created and they are destroyed only when the system is shut down or re-initialized. This is the static method.
* very simple memory usage
* objects can waste memory
Entities are created and destroyed on command. For ease of sequence editing, the destroy command should be inserted transparently by the editor. 
* processing extra commands involved in memory management can degrade performance
* extra logic in the editor to determine the right spot for destroy commands 

### Conclusion: open solution that currently implements the static method but also supports the dynamic method ###


## 3. Context and devices ##

Entities are mostly visible or audible objects that are rendered using devices. These devices are wrapped in a context, that has to be created before processing commands. A self-containing system has to implement and/or provide entry points (callbacks) for device handling and context management. Best entry point would be the initialization of the adapters.

### Conclusion: devices and contexts are created and destroyed by the singleton adapter objects at initialization. ###