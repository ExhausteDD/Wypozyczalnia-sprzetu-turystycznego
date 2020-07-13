// ADD Admin USER
document.querySelector('#add-admin-user').onsubmit = function (event) {
    event.preventDefault();
    let login = document.querySelector('#admin-user-login').value.trim();
    let password = document.querySelector('#admin-user-password').value.trim();

    if (login == '' || password == '') {
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
            'login': login,
            'password': password      
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


