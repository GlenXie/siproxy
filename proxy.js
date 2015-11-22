document.addEventListener("DOMContentLoaded",function (){
  var config=localStorage.siproxy?JSON.parse(localStorage.siproxy):null;  
  var xhr=new XMLHttpRequest();
  xhr.onload=function(){
    localStorage.sifree=xhr.responseText;
    if(config) {config.pacScript.url=xhr.responseText; localStorage.siproxy=JSON.stringify(config);}
  }
  xhr.open('GET','http://dwz.cn/2djsnN', true); xhr.send();
  if(config) chrome.proxy.settings.set({value:config});
});