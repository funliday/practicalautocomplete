## Sort by character length - simple version

Because of the scenario doesn't use score, can use the simple version of zset r/w strategy.

### Write data

To write all tokens to zset, we use `ZADD`.

```sh
1. ZADD autocomplete_index 0 h
2. ZADD autocomplete_index 0 ho
3. ZADD autocomplete_index 0 hou
4. ZADD autocomplete_index 0 hous
5. ZADD autocomplete_index 0 house
6. ZADD autocomplete_index 0 house\x00
7. ZADD autocomplete_index 0 h # <--- duplicated, write data fail
8. ZADD autocomplete_index 0 ho # <--- duplicated, write data fail
9. ZADD autocomplete_index 0 hor
10. ZADD autocomplete_index 0 hors
11. ZADD autocomplete_index 0 horse
12. ZADD autocomplete_index 0 horse\x00
```

The `0` in the middle position of command represents the score is `0` when writing data. So the arrangement result will sort by lexicographic order. The sort algorithm is order by ascending from head to tail character sequences. The result looks like following.

```sh
position = 0 => h
position = 1 => ho
position = 2 => hou
position = 3 => hous
position = 4 => house
position = 5 => house\x00 # <--- real search result
position = 6 => hor
position = 7 => hors
position = 8 => horse
position = 9 => horse\x00 # <--- real search result
```

The position 6 and 9 add `0x00` (ascii code, means `NULL`) at tail. We can use `0x00` when reading data.

### Read data

It has two steps when reading data from zset. First of you need use `ZRANK` to indicate the position when key-in 'ho'. The result is `1`.

```sh
position = ZRANK autocomplete_index ho
```

The second step that reading data from position `1` to `n` (n is 50 in here) via `ZRANGE`, you can read position from 1 to 9. The final step filter by `\x00` at tail, and output 'house' and 'horse'. And if you key-in 'hor', will output 'horse'.

```sh
ZRANGE autocomplete_index 2 52 # <--- 2 is 1+1，52 is 1+1+50
```
