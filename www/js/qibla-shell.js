(function(){
"use strict";
function ensure(){
  var main=document.querySelector("main");
  if(!document.getElementById("view-qibla")&&main){
    var sec=document.createElement("section");
    sec.id="view-qibla";sec.className="view";sec.hidden=true;
    var settings=document.getElementById("view-settings");
    if(settings)main.insertBefore(sec,settings);else main.appendChild(sec);
  }
  var tabbar=document.querySelector(".tabbar");
  if(tabbar&&!document.querySelector('.tabbar a[data-tab="qibla"]')){
    var a=document.createElement("a");
    a.href="#/qibla";a.setAttribute("data-tab","qibla");a.innerHTML="<span>قبله</span>";
    var st=document.querySelector('.tabbar a[data-tab="settings"]');
    if(st)tabbar.insertBefore(a,st);else tabbar.appendChild(a);
  }
  // Re-trigger qibla init UI if module already loaded
  if(window.SE&&SE.qibla){
    try {
      var ev = new Event("hashchange");
      window.dispatchEvent(ev);
    } catch(_){}
    var link=document.querySelector('.tabbar a[data-tab="qibla"]');
    if(link && !link.dataset.qiblaBound){
      link.dataset.qiblaBound="1";
      link.addEventListener("click",function(){
        setTimeout(function(){
          if(location.hash!=="#/qibla") location.hash="#/qibla";
          // show view manually
          document.querySelectorAll(".view").forEach(function(v){v.hidden=v.id!=="view-qibla";});
          document.querySelectorAll(".tabbar a").forEach(function(x){
            x.classList.toggle("active", x.getAttribute("data-tab")==="qibla");
          });
          if(SE.qibla.render) SE.qibla.render();
          // force build if empty
          var view=document.getElementById("view-qibla");
          if(view && !document.getElementById("qibla-card")){
            location.hash="#/qibla";
            window.dispatchEvent(new Event("hashchange"));
          }
        }, 30);
      });
    }
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure);else ensure();
setTimeout(ensure, 500);
setTimeout(ensure, 1500);
})();
