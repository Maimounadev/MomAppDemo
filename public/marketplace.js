let trash = document.getElementsByClassName('delete')
let edit = document.getElementsByClassName('edit')
//apprearance

document.querySelectorAll("input.variation").forEach(function (element) {
  element.addEventListener("click", function () {
    if (parseInt(this.value) > 3) {
      document.body.style.background = "#111";
      document.querySelector("footer").className = "dark";
    } else {
      document.body.style.background = "#f9f9f9";
    }
  });
});

// toggle list vs card view
document.querySelectorAll(".option__button").forEach(function (element) {
  element.addEventListener("click", function () {
    document.querySelectorAll(".option__button").forEach(function (button) {
      button.classList.remove("selected");
    });
    this.classList.add("selected");
    var resultsSection = document.querySelector(".results-section");
    if (this.classList.contains("option--grid")) {
      resultsSection.className = "results-section results--grid";
    } else if (this.classList.contains("option--list")) {
      resultsSection.className = "results-section results--list";
    }
  });
});

document.querySelector(".sell").addEventListener("click", postItem);

const form = document.querySelector(".form");
console.log(form);
form.style.display = "none";

function postItem() {
  form.style.display = "flex";
}

function deleteItem(_id) {
  fetch("marketplace", {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _id,
    }),
  }).then(function (response) {
    window.location.reload();
  });
}
// price filters
const priceFilterInputs = Array.from(document.getElementsByClassName('priceFilter'))
priceFilterInputs.forEach(function (element) {
  element.addEventListener("click",filterByPrice);
});

function filterByPrice(e) {
   e.preventDefault()
  let price = e.target.value;
  // let filterPage = window.location.href + "/" + price;

  fetch("marketplace?price=" + price, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log(response)
      if (response.ok) return response;
    })
    .then(function (data) {
      console.log(data)
      window.location.assign(data.url);
      
    });
    console.log(data.url)
}
Array.from(trash).forEach(function (element) {
  element.addEventListener("click", function (e) {
    const _id = e.target.dataset.id;
    // const name = this.parentNode.parentNode.childNodes[1].innerText;
    // const msg = this.parentNode.parentNode.childNodes[3].innerText;
    fetch("marketplace", {
      method: "delete",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id,
      }),
    }).then(function (response) {
      window.location.reload();
    });
  });
});

for (let e of edit){
  e.addEventListener('click', function(){
    console.log(this.parentNode.childNodes)
    const input = this.parentNode.childNodes[1]
    input.focus()
    input.select()
    input.addEventListener('keyup', editText)
  })
}
function editText(event){
  const newText = event.target.value
  const id = event.target.dataset.id // data attribute, in HTML is used to store valuable information that we need access to.
  console.log(id, newText)
  fetch('edit', {
    method: 'put',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id, newText
    })
  })
  .then(function (response) {
    // window.location.reload()
  })
}

