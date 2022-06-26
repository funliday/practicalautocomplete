## tokenize

Before write text to zset, you must to breaks it up into individual characters. E.g. "house" and "horse" can divide into tokens.

| Text | Result |
| ---- | ---------- |
| house | <ul><li>h</li><li>ho</li><li>hou</li><li>hous</li><li>house</li></ul> |
| horse | <ul><li>h</li><li>ho</li><li>hor</li><li>hors</li><li>horse</li></ul> |
