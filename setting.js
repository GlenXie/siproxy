// Copyright 2015 Glen Xie. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be found in the LICENSE file.
// https://github.com/GlenXie/siproxy
var SIProxy=SIProxy||{}; var config={},map=[];
var loc_addr,host,port,hosts,ports;
var local,data,url,bypass,msg;
var fixed_servers={'http':null,'https':null,'socks4':null,'socks5':null};
var pac_script={'data':null,'url':null,'free':null};
SIProxy.getLocal=function(){
  var pc; try{pc=new webkitRTCPeerConnection({iceServers:[]});}catch(e){}
  if(!pc){loc_addr="192.168.0.0/16"; return;}
  pc.onicecandidate=function(ice){
    if(ice.candidate){
      var ip=/([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate)[1];
      if(ip!==loc_addr) loc_addr=ip+"/24";
    }
  };
  pc.createOffer(function(result){pc.setLocalDescription(result);});
}
SIProxy.getLocal();
SIProxy.getFree=function(){
  var xhr=new XMLHttpRequest(); xhr.open('GET','http://dwz.cn/2djsnN', true);
  xhr.onload=function(){localStorage.sifree=xhr.responseText;}
  xhr.send();
}
if(!localStorage.sifree)SIProxy.getFree();
SIProxy.checkhost=function(input){
  var h=input.value.trim();
  if(/^((25[0-5]|2[0-4]\d|[0-1]?\d{1,2})\.){3}(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})$/.test(h)||/^([^.]+\.)+[^.^0-9]+$/.test(h)
   ||(h.match(/:/g)&&h.match(/:/g).length<=7&&/::/.test(h)?/^([\da-f]{1,4}(:|::)){1,6}[\da-f]{1,4}$/i.test(h):/^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(h)))
  {input.style.borderColor=""; host=h;}
  else {input.style.borderColor="red"; host=undefined;}
}
SIProxy.checkport=function(input){
  var p=parseInt(input.value.trim());
  if(p>0 && p<65536) {input.style.borderColor=""; port=p;}
  else {input.style.borderColor="red"; port=undefined;}
}
SIProxy.getUrlParams=function(){
  var sear=location.search.substr(1); if(sear.length===0) return {};
  var Params=sear.split('&'); var UrlParams={};
  for (i=0;i<Params.length; i++){var strs=Params[i].split('='); UrlParams[strs[0]]=strs[1];}
  return UrlParams;
}
SIProxy.local=function(input){
  var byp=bypass.value.split(',');
  for(var i=0;i<byp.length;i++){if(byp[i]==="") byp.splice(i--,1);}
  var ia,ib;
  if(input.checked){
    if((ia=byp.indexOf(loc_addr)) ===-1)byp.push(loc_addr);
    if((ib=byp.indexOf('<local>'))===-1)byp.push('<local>');
  }else{
    if((ia=byp.indexOf(loc_addr)) !==-1)byp.splice(ia,1);
    if((ib=byp.indexOf('<local>'))!==-1)byp.splice(ib,1);
  }
  bypass.value=byp.join(',');
}
SIProxy.setmode=function(f){
  var radio=f.children['mode']; config.mode=radio.value; radio.checked=true;
  for(var i=0;i<hosts.length;i++) {hosts[i].disabled=true;hosts[i].style.borderColor="";}
  for(var i=0;i<ports.length;i++) {ports[i].disabled=true;ports[i].style.borderColor="";}
  var h=f.querySelector('.host'); if(h){h.disabled=false;SIProxy.checkhost(h);}
  var p=f.querySelector('.port'); if(p){p.disabled=false;SIProxy.checkport(p);}
  local.disabled=bypass.disabled=!(config.mode in fixed_servers);
  data.disabled=config.mode!=='data'; url.disabled=config.mode!=='url';
}
SIProxy.submit=function(){
  var ret=(config.mode in fixed_servers)?(host&&port)?true:false:true;
  if(ret){
    msg.innerText="";
    for(var i=0;i<hosts.length;i++) hosts[i].disabled=false;
    for(var i=0;i<ports.length;i++) ports[i].disabled=false;
    localStorage.sipass=bypass.value;
    localStorage.sidata=data.value;
    localStorage.siurl=url.value;
  }else msg.innerText="请更正后再提交";
  return ret;
}
SIProxy.bind=function(){ 
  var es=document.getElementsByTagName('fieldset'); for(var i=0;i<es.length;i++)es[i].onclick=function(){SIProxy.setmode(this)};
  es=document.getElementsByClassName('host'); for(var i=0;i<es.length;i++)es[i].onchange=function(){SIProxy.checkhost(this)};
  es=document.getElementsByClassName('port'); for(var i=0;i<es.length;i++)es[i].onchange=function(){SIProxy.checkport(this)};
  local.onchange=function(){SIProxy.local(this)};
  document.getElementById('free').onclick=function(){SIProxy.getFree();}
  document.querySelector('[type=submit]').onclick=function(){return SIProxy.submit();}
}
SIProxy.loadui=function(){ 
  hosts=document.getElementsByClassName('host');for(var i=0;i<hosts.length;i++) hosts[i].disabled=true;
  ports=document.getElementsByClassName('port');for(var i=0;i<ports.length;i++) ports[i].disabled=true;
  local=document.getElementById('local'); data=document.getElementById('data');
  url=document.getElementById('url'); bypass=document.getElementById('bypass');
  msg=document.getElementById('msg');  
  if(config.mode==='pac_script') config.mode=localStorage.sipac;
  if(config.mode==='fixed_servers'){
    config.mode=config.rules.singleProxy.scheme;
    document.querySelector('[name=h_'+config.mode+']').disabled=false;
    document.querySelector('[name=p_'+config.mode+']').disabled=false;
  }else local.disabled=bypass.disabled=true;
  document.querySelector('[value='+config.mode+']').checked=true;
  for(var i=0;i<map.length;i++) {
    document.getElementsByName('h_'+map[i].sch).item(0).value=map[i].host;
    document.getElementsByName('p_'+map[i].sch).item(0).value=map[i].port;
  };  
  bypass.value=localStorage.sipass||""; local.checked=(localStorage.sipass||"").search('<local>')!==-1;
  data.value=localStorage.sidata||""; data.disabled=config.mode!=='data';
  url.value=localStorage.siurl||""; url.disabled=config.mode!=='url';
}
window.onload=function(){
  var sc=document.createElement('script');sc.type="text/javascript";sc.src="https://tajs.qq.com/stats?sId=52587322";sc.charset="UTF-8";
  document.getElementsByTagName('head')[0].appendChild(sc);
  var params=SIProxy.getUrlParams();
  if(params.mode in fixed_servers){//by submit
    config.mode="fixed_servers"; config.rules={}; host=params['h_'+params.mode]; port=parseInt(params['p_'+params.mode]);
    config.rules.singleProxy={'scheme':params.mode, 'host':host, 'port':port};
    config.rules.bypassList=localStorage.sipass.split(',');
  }else if(params.mode in pac_script){
    localStorage.sipac=params.mode; config.mode='pac_script';
    if(params.mode==='data') config.pacScript={data:localStorage.sidata};
    else config.pacScript={url:localStorage['si'+params.mode]};
  }else config.mode=params.mode;
  if(config.mode){//by submit
    chrome.proxy.settings.set({value:config});
    localStorage.siproxy=JSON.stringify(config);
    for(var sch in fixed_servers){var m={}; m.sch=sch; m.host=params['h_'+sch]; m.port=params['p_'+sch]; map.push(m);};
    localStorage.simap=JSON.stringify(map);
  }else if(localStorage.siproxy){//by show
    config=JSON.parse(localStorage.siproxy);
    map=JSON.parse(localStorage.simap);
  }else config.mode="direct";
  SIProxy.loadui();
  SIProxy.bind();
}
