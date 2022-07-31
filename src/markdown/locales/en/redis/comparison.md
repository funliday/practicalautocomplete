## Comparison between simple and complicated version

Whether sort by length or by frequency, the `complicated` version can be suitable them. But the `complicated` version has some problem (like maintenance)

<table class="table">
    <thead>
        <tr>
            <th>Comparison</th>
            <th>Simple version</th>
            <th>Complicated version</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Write data</td>
            <td>
                We will write every n-gram of keyword, in addition to add a complete keyword with delimiter
            </td>
            <td>
                When writing, we will append every n-gram of keyword at key tail, and value is complete keyword
            </td>
        </tr>
        <tr>
            <td>Read data</td>
            <td>
                Use <code>ZRANK</code> to indicate position then use <code>ZRANGE</code> to retrieve data, the final step is filter out unnecessary value. It can developed by lua
            </td>
            <td>
                Use <code>ZRANGE</code> to retrieve data directly
            </td>
        </tr>
        <tr>
            <td>Delete data</td>
            <td>
                Use <code>DEL</code> to delete all data
            </td>
            <td>
                Use <code>SCAN</code> iterating to delete data
            </td>
        </tr>
        <tr>
            <td>
                Data size (key prefix is <code>autocomplete_index</code>, and data are <code>house</code> and <code>horse</code>)
            </td>
            <td>68 bytes</td>
            <td>242 bytes</td>
        </tr>
    </tbody>
</table>

### Summary

1. To save the data storage: Use `simple` version, but more code in the backend in order to pre-processing and post-processing
2. Sort by frequency: You must use `complicated` version, because if `simple` version can't sort directly.
3. `Simple` version can't ensure the count of result, because the `ZRANGE` of result includes unnecessary data. It maybe contains no data after filtering.
4. When maintaining data, redis need more extra 1x data size. The new data use different key prefix when writing. The final step use `RENAME` to rename key prefix.
    * If you use `complicated` version, it will consume more time when `RENAME` process.
