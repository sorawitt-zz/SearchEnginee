const algoliasearch = require('algoliasearch');
const dotenv = require('dotenv');
const firebase = require('firebase');
const express = require('express')
const app = express()

var port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('Hello World! :P'))

app.listen(port, () => console.log('Example app listening on port 3000!'))

// load values from the .env file in this directory into process.env
dotenv.load();

// configure firebase
firebase.initializeApp({
  apiKey: "AIzaSyDAbkqkxfD1OBwq2HuI--fXWXoE0vDXzeo",
  authDomain: "parentsherotest.firebaseapp.com",
  databaseURL: "https://parentsherotest.firebaseio.com",
  projectId: "parentsherotest",
  storageBucket: "parentsherotest.appspot.com",
  messagingSenderId: "306898194272"
});
const database = firebase.database();

// configure algolia
const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_API_KEY
);
const index = algolia.initIndex('school');

// Get all contacts from Firebase
database.ref('/school').once('value', schools => {
  // Build an array of all records to push to Algolia
  const records = [];
  schools.forEach(school => {
    // get the key and data from the snapshot
    const childKey = school.key;
    const childData = school.val();
    // We set the Algolia objectID as the Firebase .key
    childData.objectID = childKey;
    // Add object for indexing
    records.push(childData);
  });

  // Add or update new objects
  index
    .saveObjects(records)
    .then(() => {
      console.log('School imported into Algolia');
    })
    .catch(error => {
      console.error('Error when importing school into Algolia', error);
      process.exit(1);
    });
});

const schoolsRef = database.ref('/school');
schoolsRef.on('child_added', addOrUpdateIndexRecord);
schoolsRef.on('child_changed', addOrUpdateIndexRecord);
schoolsRef.on('child_removed', deleteIndexRecord);

function addOrUpdateIndexRecord(school) {
  // Get Firebase object
  const record = school.val();
  // Specify Algolia's objectID using the Firebase object key
  record.objectID = school.key;
  // Add or update object
  index
    .saveObject(record)
    .then(() => {
      console.log('Firebase object indexed in Algolia', record.objectID);
    })
    .catch(error => {
      console.error('Error when indexing contact into Algolia', error);
      process.exit(1);
    });
}

function deleteIndexRecord(school) {
  // Get Algolia's objectID from the Firebase object key
  const objectID = school.key;
  // Remove the object from Algolia
  index
    .deleteObject(objectID)
    .then(() => {
      console.log('Firebase object deleted from Algolia', objectID);
    })
    .catch(error => {
      console.error('Error when deleting contact from Algolia', error);
      process.exit(1);
    });
}
