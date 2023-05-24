const sellerButtons = document.querySelectorAll('.sellToUser');

  Array.from(sellerButtons).forEach(function(element) {
    element.addEventListener('click', function(){
      const buyer = this.getAttribute('data-seller');
      const itemId = this.getAttribute('data-itemId');
      console.log(buyer)
      console.log(itemId)
      fetch('listings', {
        method: 'put',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          buyer: buyer,
          itemId: itemId,
          
        })
      })
      .then(response => {
        if (response.ok) return response.json()
      })
      .then(data => {
        console.log(data)
        window.location.reload(true)
      })
    });
  });