(function() {
  // prints "hi" in the browser's dev tools console
  // console.log('hi');
  
  const form = document.forms[0]; //Full form for JSON input
  const textarea = document.getElementById("inputCSV") //Input box for JSON

  // Suppress any dragover events that interfere with drop
  textarea.ondragover = e => {
      e.preventDefault();
    };
  
  // On drop, read file as text and display in textarea
  textarea.ondrop = function(e) {
    e.preventDefault();
    let files = e.dataTransfer.files;
    let reader = new FileReader();
    reader.onload = e => {
      this.value = e.target.result;
    }
    for (let i=0;i<files.length;i++) {
      reader.readAsText(files[i]);
    }
  };
  
  // listen for the form to be submitted and project network when it is
  form.onsubmit = function(event) {
    // stop our form submission from refreshing the page
    event.preventDefault();
    
    let data = textarea.value; // Get value of text area (usually from a CSV)
    let column = document.querySelector('input[name = "columnProject"]:checked').value; // Get value of column selector
    let projection = project(data, column); // Project network
    console.log(projection); // Put the resulting data in the console, for testing
    let csv = Papa.unparse(projection); // Get the data into a csv string using PapaParse
    createDownloadLink(csv); // Create the link to download the data.
  };
  
  
  const createDownloadLink = (csvContent) => {
    // This function creates the "download CSV" button
    
    // First find and remove any old download buttons
    let previousLink = document.getElementById("downloadLink");
    if (previousLink !== null) { previousLink.remove(); };
    
    
    csvContent = "data:text/csv;charset=utf-8," + csvContent; // Add proper header to CSV string
    let encodedUri = encodeURI(csvContent); // Encode it for download
    
    // Create link and add attributes, with button
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "projected_network.csv");
    link.setAttribute("id", "downloadLink")
    let button = document.createElement("button");
    button.innerHTML= "Download Projected CSV";
    link.appendChild(button);
    document.body.appendChild(link);
  };
  
  const project = (data, projectColumn) => {
    var edges = Papa.parse(data).data; // Parse CSV data with PapaParse and pull out arrays
    var output = []; // Empty array for final results
    
    // Get indices from selected column for projection
    var nodeIndex = Number(projectColumn) - 1;
    var edgeIndex;
    if (nodeIndex === 0) {
      edgeIndex = 1;
    } else {
      edgeIndex = 0;
    }

    // Get a list of the nodes to project onto
    let nodes = edges.map(e => e[nodeIndex]);
    
    // Loop through those
    nodes.forEach(n => {
      // Pull out neighbors
      let node_neighbors = [];
      edges.forEach(e => {
        if (n === e[nodeIndex]) {
          node_neighbors.push(e[edgeIndex]);
        }
      });
      // Go one step deeper and pull out 2nd degree neighbors
      let two_degree = [];
      node_neighbors.forEach(neighbor => {
        edges.forEach(e => {
          if (e[edgeIndex] === neighbor && e[nodeIndex] !== n) {
            two_degree.push(e[nodeIndex]);
          }
        });
      });
      
      // Make edges from nodes and 2nd degree neightbors, sorted alphabetically
      let newEdges = two_degree.map(td => [n, td].sort());
      
      // Create a Map of string representations and list, for reassembly later.
      var mappedEdges = new Map();
      newEdges.forEach(item => {
        mappedEdges.set(item.toString(), item)
      });
      
      // Make a map of counts for each new Edge, store as strings so they can be counted
      var weightedStrings = new Map();
      newEdges.forEach(item => {
        weightedStrings.set(item.toString(), (weightedStrings.get(item.toString()) || 0) + 1)
      })
      
      // Created weighted edges from the mappedEdges and the weightedStrings
      for (var [key, value] of weightedStrings){
        let weightedEdge = [mappedEdges.get(key)[0], mappedEdges.get(key)[1], value]; // Put together the two Maps
        let stringEdge = weightedEdge.toString(); // Convert to string to test if it's in the list
        let test_output = output.map(o => o.toString()); // Also convert outputs to list of string
        if (test_output.indexOf(stringEdge) === -1) { // If the edge isn't in the output already, then...
          output.push(weightedEdge); // ... put it there
        }
      }
    })
    return output;
  }
  
})();

/*
Test Data:

A1,B1
A1,B2
A2,B1
A3,B1
A3,B2
A4,B2
*/