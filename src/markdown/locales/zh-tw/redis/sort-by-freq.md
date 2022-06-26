## 依照使用頻率排序 - 複雜版

這個情境因為有外部分數影響，所以我們必須要換另一種方式的 zset 讀寫策略。

### 寫入資料時

我們一樣是使用 `ZADD` 的方式，將所有的 token 都寫入到 zset 裡面。但此處因為有分數的關係，所以在寫入資料時可以把 index 的名稱加上 token，另外把分數加上去。

```sh
1. ZADD autocomplete_index:東 100 東京鐵塔
2. ZADD autocomplete_index:東京 100 東京鐵塔
3. ZADD autocomplete_index:東京鐵 100 東京鐵塔
4. ZADD autocomplete_index:東京鐵塔 100 東京鐵塔
5. ZADD autocomplete_index:東 240 東京巨蛋球場
6. ZADD autocomplete_index:東京 240 東京巨蛋球場
7. ZADD autocomplete_index:東京巨 240 東京巨蛋球場
8. ZADD autocomplete_index:東京巨蛋 240 東京巨蛋球場
9. ZADD autocomplete_index:東京巨蛋球 240 東京巨蛋球場
10. ZADD autocomplete_index:東京巨蛋球場 240 東京巨蛋球場
```

在寫入時，中間的 `100` 表示這一個資料的分數為 `100`，所以最後排序時會先依照資料的分數做升冪排列，如果分數一樣才做字典排序 (lexicographic order)，所以最後寫到 zset 的結果會變成下面這樣。

```sh
# autocomplete_index:東
autocomplete_index:東 100 東京鐵塔
autocomplete_index:東 240 東京巨蛋球場

# autocomplete_index:東京
autocomplete_index:東京 100 東京鐵塔
autocomplete_index:東京 240 東京巨蛋球場

# autocomplete_index:東京鐵
autocomplete_index:東京鐵 100 東京鐵塔

# autocomplete_index:東京鐵塔
autocomplete_index:東京鐵塔 100 東京鐵塔

# autocomplete_index:東京巨
autocomplete_index:東京巨 240 東京巨蛋球場

# autocomplete_index:東京巨蛋
autocomplete_index:東京巨蛋 240 東京巨蛋球場

# autocomplete_index:東京巨蛋球
autocomplete_index:東京巨蛋球 240 東京巨蛋球場

# autocomplete_index:東京巨蛋球場
autocomplete_index:東京巨蛋球場 240 東京巨蛋球場
```

### 讀取資料時

不需先使用 `ZRANK` 將資料定位，此處直接使用 `ZRANGE` 就可以取得資料了，但要注意必須要加上 `BYSCORE` 及 `REV` 兩個參數，表示必須使用分數 (`BYSCORE`) 做降冪排序 (`REV`)

```sh
ZRANGE autocomplete_index:東京 +INF -INF BYSCORE REV LIMIT 0 50
```