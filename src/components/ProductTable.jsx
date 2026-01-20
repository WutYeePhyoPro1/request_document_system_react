export default function ProductTable(){
    const tablestyle = {
        thead: { backgroundColor: "#A9D8E9" },
        th: { backgroundColor: "inherit" },
    }

    return (
        <>
        <table id="productTable" className="table">
            <thead style={tablestyle['thead']}>
                <tr>
                    <th style={tablestyle['th']}>Actions</th>
                    <th style={tablestyle['th']}>No</th>
                    <th style={tablestyle['th']}>Product Code</th>
                    <th style={tablestyle['th']}>Unit</th>
                    <th style={tablestyle['th']}>Price</th>
                    <th style={tablestyle['th']}>Net Cost Price</th>
                    <th style={tablestyle['th']}>Price 1</th>
                    <th style={tablestyle['th']}>Price 2</th>
                    <th style={tablestyle['th']}>Profit</th>
                </tr>

            </thead>
        </table>
        </>
    )
}