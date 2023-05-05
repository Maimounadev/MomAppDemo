document.querySelector('.sell').addEventListener('click', postItem)
document.querySelector('.view').addEventListener('click', viewItems)
document.querySelector('.buy').addEventListener('click', buyItem)
const form = document.querySelector('.form')
const market = document.querySelector('.market')
form.style.display = "none"
function postItem() {
form.style.display = 'flex'
}
function viewItems() {
    market.style.display = 'flex'
    form.style.display = 'none'
}
function buyItem(e) {
    const _id = e.target.value
    fetch('buy', {
        method: 'put',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          _id
        })
      })
      .then(response => {
        if (response.ok) return response.json()
      })
      .then(data => {
        console.log(data)
        window.location.reload(true)
      })
}