## Sort by frequency - complicated version

We need to use another zset r/w strategy because the scenario has external score.

### Write data

When writing data, we still use `ZADD` to write all tokens to zset. But we add token at index name tail and real score additionally.

```sh
1. ZADD autocomplete_index:h 100 house
2. ZADD autocomplete_index:ho 100 house
3. ZADD autocomplete_index:hou 100 house
4. ZADD autocomplete_index:hous 100 house
5. ZADD autocomplete_index:house 100 house
6. ZADD autocomplete_index:h 240 horse
7. ZADD autocomplete_index:ho 240 horse
8. ZADD autocomplete_index:hor 240 horse
9. ZADD autocomplete_index:hors 240 horse
10. ZADD autocomplete_index:horse 240 horse
```

The `100` in the middle position of command represents the score is `100` when writing data. So the arrangement result will sort by lexicographic order. The sort algorithm is order by ascending from head to tail character sequences. The result looks like following.

```sh
# autocomplete_index:h
autocomplete_index:h 100 house
autocomplete_index:h 240 horse

# autocomplete_index:ho
autocomplete_index:ho 100 house
autocomplete_index:ho 240 horse

# autocomplete_index:hou
autocomplete_index:hou 100 house

# autocomplete_index:hous
autocomplete_index:hous 100 house

# autocomplete_index:house
autocomplete_index:house 100 house

# autocomplete_index:hor
autocomplete_index:hor 240 horse

# autocomplete_index:hors
autocomplete_index:hors 240 horse

# autocomplete_index:horse
autocomplete_index:horse 240 horse
```

### Read data

You don't need `ZRANK` to indicate the position, only use `ZRANGE` can read data. But you need some parameters (`BYSCORE` and `REV`), it represents using score to ordering them.

```sh
ZRANGE autocomplete_index:ho +INF -INF BYSCORE REV LIMIT 0 50
```
