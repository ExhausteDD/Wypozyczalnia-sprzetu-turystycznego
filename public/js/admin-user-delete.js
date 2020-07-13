// DELETE Admin USER
document.querySelector('#delete-admin-user').onclick = function (event) {
    event.preventDefault();
    let id = document.querySelector('#admin-user-id').value.trim();

    

    fetch('/delete-admin-user', {
        method: 'POST',
        body: JSON.stringify({
            'id': id      
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            console.log(response);
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