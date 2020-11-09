const API_URL = 'http://198.11.172.117/sbm-dashboard/kitchen';

let isLoggedIn = () => {
  if(localStorage.getItem('kitchenLogin')){
    return true;
  }else{
    return false;
  }
}
async function login (shop_id, key) {
  let res;
  try{
    Pace.restart()
    res = await $.ajax({
      url: API_URL + '/login',
      data: {
        name: shop_id,
        key: key
      },
      method: 'post'
    })
    return res;
  }catch(err){
    return err;
  }
}
let logout = () => {
  localStorage.removeItem('kitchenLogin')
  window.location.href = 'login.html'
}
$('#loginForm').submit(function(e){
  e.preventDefault();
  let name = $('#loginForm input[name="shop_id"]').val();
  let key = $('#loginForm input[name="key"]').val();
  login(name, key).then((res, err) => {
    if(err) $('.auth-failed').removeClass('hide');
    if(JSON.parse(res)['res'] == 1){
      $('.auth-failed').addClass('hide');
      localStorage.setItem('kitchenLogin', JSON.stringify({
        shop_id: name,
        key: key
      }))
      if($('#remember_me_checkbox:checked').length != 0){
        localStorage.setItem('kitchenRememberMe', JSON.stringify({
          shop_id: name,
          key: key
        }))
      }
      window.location.href = 'index.html';
    }else{
      $('.auth-failed').removeClass('hide');
    }
  })
})

$(function(){
  if(window.location.href.indexOf('index.html') > 0){
    if(!isLoggedIn()){
      window.location.href = 'login.html'
    }
  }else{
    if(isLoggedIn()){
      window.location.href = 'index.html'
    }
    if(localStorage.getItem('kitchenRememberMe')){
      let credential = JSON.parse(localStorage.getItem('kitchenRememberMe'));
      $('#loginForm input[name="shop_id"]').val(credential.shop_id)
      $('#loginForm input[name="key"]').val(credential.key)
    }
  }
})