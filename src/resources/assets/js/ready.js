document.addEventListener("DOMContentLoaded", function () {
    if (typeof InfinityGrid !== "undefined") {
        InfinityGrid.init({
            el: "#infinity-grid",
            columns: [
                { field: "id", title: "ID" },
                { field: "name", title: "Name" }
            ],
            data: [
                { id: 1, name: "Test 1" },
                { id: 2, name: "Test 2" }
            ]
        });
    } else {
        console.error("InfinityGrid nu este definit.");
    }
});
