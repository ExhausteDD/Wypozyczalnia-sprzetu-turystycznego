document.querySelector('#add-category').onsubmit = function (event) {
    let category = document.querySelector('#category-name').value.trim();
    let description = document.querySelector('#category-description').value.trim();
    let image = document.querySelector('#category-image').value.trim();

    if (category == '' || description == '' || image == '') {
        //не заполнены поля
        Swal.fire({
            title : 'Warning',
            text: 'Fill all fields',
            type: 'info',
            confirmButtonText: 'OK'
        });
    }

    fetch('/add-category', {
        method: 'POST',
        body: JSON.stringify({
            'category': category,
            'description': description,
            'image': image  
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            return response.text();
        })
        .then(function (body) {
            if (body == 1) {
                Swal.fire({
                    title: 'Success',
                    text: 'Success',
                    type: 'info',
                    confirmButtonText: 'Ok'
                });
            }
            else {
                Swal.fire({
                    title: 'Problem with something',
                    text: 'Error',
                    type: 'error',
                    confirmButtonText: 'Ok'
                });
            }
        })
}
