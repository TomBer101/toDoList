//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
mongoose.connect("mongodb+srv://tomerm1233:tomBer1233@cluster0.nhspiky.mongodb.net/todoListDB").then(() => console.log("Connected to MongoDB"));

const ItemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", ItemsSchema);

const listSchema = {
  name: String,
  items: [ItemsSchema]
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + to add an item."
});

const item3 = new Item({
  name: "<---- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

  Item.find({})
  .then((items) => {
    if(items.length === 0){
      Item.insertMany(defaultItems).then(() => console.log("Default items were inserted")).catch((err) => console.log(err));
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  })
  .catch((err)=> {
    console.log(err);
  })

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today"){
      newItem.save();
      res.redirect("/");
  } else {
      List.findOne({name: listName}).then(function(doc){
      if(!doc){
        console.log("Error: the list does not exists.");
      } else {
        doc.items.push(newItem);
        doc.save();
        res.redirect("/"+listName);
      }
    });
  }


});

app.post("/delete", function(req, res){
  const checkedItemId = (req.body.checkBox);
  const listName = req.body.listName;

  if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId)
      .then(() => console.log("The item " + checkedItemId + " was removed."))
      .catch((err) => {
        if(err){
          console.log(err);
        }
      });

      res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((foundList) => {
      res.redirect("/" + listName);
    }).catch((err) => console.log(err));
  }

});

app.get("/:listTopic", function(req, res) {
  const listTopic = _.capitalize(req.params.listTopic);  

  const listToSearch = List.findOne({name: listTopic}).then(function(doc){
    if(!doc){
      const list = new List({
        name: listTopic, 
        items: defaultItems
      });
      
      list.save();
      res.redirect("/" + listTopic)
    } else {
      res.render("list", {listTitle: doc.name, newListItems: doc.items});
    }
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
