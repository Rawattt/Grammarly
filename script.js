// Custom Elements for errors in the text
// Used select element
// Selected options is bad word
// Other options are good words
class CustomEl extends HTMLElement {
  renderSpan() {
    let better = this.getAttribute('better').split(',');
    let options = '';
    better.forEach(
      (item) => (options += `<option value=${item}>${item}</option>`)
    );
    this.innerHTML = `<select class='errors' onchange="changeHandler(this)">
    <option class='hide' value=${this.getAttribute(
      'bad'
    )} selected>${this.getAttribute('bad')}</option>
    ${options}
  </select>`;
  }
  connectedCallback() {
    if (!this.rendered) {
      this.renderSpan();
      this.rendered = true;
    }
  }
}
customElements.define('select-el', CustomEl);

// Variables
const api_key = 'you api key';
const form = document.querySelector('form');
const output = document.querySelector('.output');

//Reads data from text file and use textgears api
const formSubmitHandler = (e) => {
  e.preventDefault();
  let reader = new FileReader();
  let file = e.target['text-file'].files[0];
  reader.readAsText(file);
  reader.onload = async () => {
    output.innerHTML = '';
    let tmp = reader.result;
    let data = tmp.split('\n');

    //  Create an array of promises
    let promiseArr = data.map((s) => {
      let i = s.split(' ').join('+');
      return fetch(
        `https://api.textgears.com/grammar?key=${api_key}&text=${i}&language=en-GB`
      );
    });
    const res = await Promise.all(promiseArr);

    //     Again created array of promises
    let jsonArr = res.map((i) => {
      let tmp = i.json();
      return tmp;
    });
    const finalRes = await Promise.all(jsonArr);

    //     Process all the data received from the api
    filterResponse(data, finalRes);

    //     Add right click event handler
    const all_errors = document.querySelectorAll('.errors');
    Array.from(all_errors).forEach((item) => rightClick(item));
  };
};

// For all the response from the api process the data
const filterResponse = (data, res) => {
  for (let i = 0; i < data.length; i++) {
    outputResult(data[i], res[i].response.errors);
  }
};

// Output the data for every request made to the api
const outputResult = (data, res) => {
  data = data.replaceAll('+', ' ');
  let result = '';

  //   Check if there are no errors
  if (res.length > 0) {
    j = 0;

    res.forEach((i) => {
      let { offset, length, bad, better } = i;
      let options = better.join(',');
      result += data.slice(j, offset);
      result += `<select-el bad=${bad} better=${options}></select-el>`;
      j = offset + length;
    });

    output.innerHTML += result;
  } else {
    output.innerHTML += data;
  }
  output.innerHTML += ' ';
};

// Right click event handler
const rightClick = (el) => {
  el.addEventListener('contextmenu', (e) => {
    let click = new Event('click');
    el.dispatchEvent(click);
  });
};

// Form submit event handler
form.addEventListener('submit', (e) => formSubmitHandler(e));

// Function to change the 'bad' data with 'better' data
function changeHandler(el) {
  let data = document.createTextNode(el.value);
  el.before(data);
  el.remove();
}

window.addEventListener('contextmenu', (e) => e.preventDefault());
