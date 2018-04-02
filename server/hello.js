var { graphql, buildSchema } = require('graphql');

var schema = buildSchema(`
  type Query {
    hello :User
  }
  type User{
    label:String
    desc:String
  }
`);

var root = {hello : () => { label: () => '{label:"l1",desc:"Hello world! ishan"}' }};

graphql(schema, '{ hello { label } }', root).then((response) => {
  console.log(response);
});