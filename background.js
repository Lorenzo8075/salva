// self.addEventListener('message', (event) => {
//     const url = event.data.url;
//     fetch(url)
//         .then(response => response.text())
//         .then(text => {
//             let parser = new DOMParser();
//             let htmlDocument = parser.parseFromString(text, "text/html");
//             let title = htmlDocument.querySelector("title").innerText;
//             event.ports[0].postMessage({ title: title });
//         })
//         .catch(error => console.log(error));
// });