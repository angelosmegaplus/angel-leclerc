document.querySelectorAll('[data-url]').forEach((button)=>{
  button.addEventListener('click',()=>{
    const url=button.getAttribute('data-url');
    if(/^https:\/\//i.test(url||'')) window.location.href=url;
  });
});
