function shuffleListItems() {
    const list = document.querySelector('ul');
    for (let i = list.children.length; i >= 0; i--) {
      list.appendChild(list.children[Math.random() * i | 0]);
    }
  }
  
  window.addEventListener('load', shuffleListItems);