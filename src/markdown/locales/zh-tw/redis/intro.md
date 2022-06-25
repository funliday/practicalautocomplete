# Redis

Redis 是一套非常強大的記憶體資料庫，其中包括了 set, list, hash 這些大家在開發程式時常用的資料結構，其中有一個稱為 Sorted set (以下簡稱 zset) 的資料結構，剛好可以運用在 autocomplete 功能上。

顧名思義，zset 其實就是在儲存資料時，會將不重複的資料依照字典排序儲存起來。所以儲存 autocomplete 的資料時，可以直接將資料儲存進去，不用耗費額外的工作。