$('#frmSignin').on('submit', function(e){
    e.preventDefault();
    var data = $('#frmSignin').serializeForm();

    if(data.username == "" || data.password == "") return;

    $('#frmSignin .btn').prop('disabled', true);
    $('#frmSignin .form-control').prop('disabled', true);
    $.ajax({
        url: '/signin',
        method: 'post',
        data: data,
        dataType: 'json',
        success: function(res){
            if(res.status == 'invalid')  $('#signinGrp').addClass('alert alert-warning').html('<i class="fe-alert-triangle font-size-xl mr-3"></i> ' + res.message).show();
            else if(res.status == 'error')  $('#signinGrp').addClass('alert alert-danger').html('<i class="fe-x-circle font-size-xl mr-3"></i> ' + res.message).show();
            else return window.location.href = res.next;
            $('#frmSignin .btn').removeAttr('disabled');
            $('#frmSignin .form-control').removeAttr('disabled');
        },
    });
});

$('#frmSignup').on('submit', function(e){
    e.preventDefault();
    var isValid = true;
    $('#frmSignup input').each(function(){
         if($(this).is( ":invalid" )) isValid = false;
    });
    if(!isValid){
        return
    }
    var data = $('#frmSignup').serializeForm();

    if(data.username == "" || data.email == "" || data.password == "" || data.password2 == "") return;
    if(data.password == data.password2) validPassword();
    else return invalidPassword();

    $('#frmSignup .btn').prop('disabled', true);
    $('#frmSignup .form-control').prop('disabled', true);
    $.ajax({
        url: '/signup',
        method: 'post',
        data: data,
        dataType: 'json',
        success: function(res){
            if(res.status == 'invalid')  $('#signupGrp').addClass('alert alert-warning').html('<i class="fe-alert-triangle font-size-xl mr-3"></i> ' + res.message).show();
            else if(res.status == 'error')  $('#signupGrp').addClass('alert alert-danger').html('<i class="fe-x-circle font-size-xl mr-3"></i> ' + res.message).show();
            else return window.location.href = res.next;
            $('#frmSignup .btn').removeAttr('disabled');
            $('#frmSignup .form-control').removeAttr('disabled');
        },
    });
});

document.getElementById('frmSignup').querySelectorAll('.form-control').forEach(input => {
    input.addEventListener(('input'), () => {
        $('#signupGrp').removeClass('alert, alert-warning, alert-danger').html('').hide();
        if(input.getAttribute('name') === 'password' || input.getAttribute('name') === 'password2'){
            document.getElementById('frmSignup').classList.add('was-validated');
            if(isPasswordMatch()) validPassword();
            else invalidPassword();
        }else {
            if (input.checkValidity()) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                input.setCustomValidity('');
            } else {
                console.log(input.checkValidity());
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
        }
    });
});

function validPassword(){
    var pass = document.getElementById('signup_password'), pass2 = document.getElementById('signup_password2');
    pass.classList.remove('is-invalid');
    pass.classList.add('is-valid');
    pass.setCustomValidity('');
    pass2.classList.remove('is-invalid');
    pass2.classList.add('is-valid');
    pass2.setCustomValidity('');
}

function invalidPassword(){
    var pass = document.getElementById('signup_password'), pass2 = document.getElementById('signup_password2');
    pass.classList.remove('is-valid');
    pass2.classList.remove('is-valid');
    pass.setCustomValidity('invalid');
    pass.classList.add('is-invalid');
    pass2.classList.add('is-invalid');
    pass2.setCustomValidity('invalid');
}

function isPasswordMatch(){
    return document.getElementById('signup_password').value === document.getElementById('signup_password2').value;
}