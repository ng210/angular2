## Design derived from an example

### Rules
```
 # │ Replace   │ Type │ Priority
═══╪═══════════╪══════╪═════════
 1 │ M1L → M2  │   R  │    10  
 2 │ M1M2 → M2 │   R  │    10  
 3 │ LM → M1   │   L  │     8  
 4 │ A1L → A2  │   R  │     6  
 5 │ A1A2 → A2 │   R  │     6  
 6 │ A1M2 → A2 │   R  │     6  
 7 │ LA → A1   │   L  │     4  
 8 │ M2A → A1  │   L  │     4  
 9 │ A2A → A1  │   L  │     4  
10 │ M2 → R    │   -  │     2  
11 │ A2 → R    │   -  │     2  
12 │ L → R     │   -  │     2  
```

### Expressions and their resolution
1+2+3
```
LALAL → 7 A1LAL → 4 A2AL → 9 A1L → 4 A2 → 11 R
```
1+2\*3
```
LALML → 3 LAM1L → 1 LAM2 → 7 A1M2 → 6 A2 → 11 R
```
1\*2+3
```
LMLAL → 3 M1LAL → 1 M2AL → 8 A1L = > 4 A2 → 11 R
```
1+2\*3+4
```
LALMLAL → 3 LAM1LAL → 1 LAM2AL → 7 A1M2AL → 6 A2AL → 9 A1L → 4 A2 → 11 R
```
1\*2+3\*4
```
LMLALML → 3 M1LALML → 3 M1LAM1L → 1 M2AM1L → 1 M2AM2 → 8 A1M2 → 6 A2 → 11 R
```

## Rule
```
    { input: 'LM', output:'M1', type:'L', priority: 8, action: null }  
```
* after preprocessing  
```
    { input: 'LM', output:'M1', type:'L', priority: 8,
      action: rule_appendLeft, in: [8,1], out:5 }  
```

### Preprocess rules
```
if (typeof rule.action !== 'function') {
    if (rule.type == 'L') rule.action = rule_appendLeft;
    else if (rule.type == 'R') rule.action = rule_appendRight;
    else rule.action = rule_noAction;
}  
```
