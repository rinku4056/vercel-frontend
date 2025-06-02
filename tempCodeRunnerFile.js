
// Example query
con.query('SELECT * FROM login', (err, results, fields) => {
  if (err) {
    console.error(err);
  } else {
    console.log(results);  // Print results from the query
  }
});