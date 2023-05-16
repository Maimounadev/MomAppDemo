//apprearance
document.querySelectorAll("input.variation").forEach(function(element) {
  element.addEventListener("click", function() {
  if (parseInt(this.value) > 3) {
  document.body.style.background = "#111";
  document.querySelector("footer").className = "dark";
  } else {
  document.body.style.background = "#f9f9f9";
  }
  });
  });
  
  // toggle list vs card view
  document.querySelectorAll(".option__button").forEach(function(element) {
  element.addEventListener("click", function() {
  document.querySelectorAll(".option__button").forEach(function(button) {
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
console.log(form)
form.style.display = "none";

function postItem() {
  form.style.display = "flex";
}

function deleteItem(_id) {
    fetch('marketplace', {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        _id
      })
    }).then(function (response) {
      window.location.reload()
    })
  ;
}

