

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { DiffieHellmanGroup } = require("crypto");
mongoose.set('strictQuery', true);
const mongoDB = "mongodb://127.0.0.1:27017/todolistDB";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(mongoDB,(err)=>{
  if(err){
    console.log(err);
  }else{
    console.log("MongoDB is Connected");
  }
});

const itemsSchema = mongoose.Schema({
  name: String
});


const Item = mongoose.model("Item",itemsSchema);

const newItem = Item({
  name: "Hello"
});
const newItem1 = Item({
  name: "Click + to Add new Items"
});
const newItem2 = Item({
  name: "Click <--- here to delete Item"
});

const defaultItems = [newItem,newItem1,newItem2];


const listSchema = {
  name: String,
  items: [itemsSchema]            // here we're storing listSchema so that we can store defaultItems array : what happens with this is we'll able to prefetech default arry items in every to do list page: /work then we'll have work as name with default items in our new todolist page 
};

const List = mongoose.model("List", listSchema);             // created a new collection of name List so now we total hv 2 collection in our databasse 1.Item 2.List







app.get("/", function(req, res) {

  Item.find({},(err,foundItems)=>{                  // here find{} will find all items of database  
  
  if(foundItems.length === 0) {                     // what we did here is we checked if our database is empty then add items in db . this is just to enter pre saved 3 items to database
    Item.insertMany(defaultItems ,(err)=>{
      if(err){
        console.log(err);
      }else{
        console.log("Successfully saved default items to DB.");
      }
    });
  res.redirect("/");                                                 // what it does is as soon as we entered items in empty database we'll redirect homepage and again if will check database this time it is not empty then send items to list.ejs page and we'll able to see our items
  }else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});    // here now we're  sinding database items to list page

  }
});

// const day = date.getDate();

});



app.get("/:customListName",(req,res)=>{                   // here we'll store every new list name and prefeteched defautl items in our database
  const customListName = req.params.customListName;

  //finding one so that user cant create a custom list with same name again and agin

  List.findOne({name: customListName},(err,foundList)=>{    // here findOne will matching user given name on url withexisting names in our List collection
             //which name to find          it will conatin that item inside matching item we'll have name and item as per schema
    if(!foundList){
       console.log("dosen't exist!");
       //Create a new list
       const list = List({                                    // here we inserted our 1st item in List collection 
        name:customListName,                                 
        items: defaultItems                                  
      });
    
      list.save();
      res.redirect("/" + customListName);                   // so that each time we create new custom list we land on same list page
       
    }else{
      console.log("Exists!");
      // Show an existing list
      res.render("list",{listTitle:foundList.name , newListItems: foundList.items})     // foundlist will contain whole item that has a name and item so to access name which will be our heading .name and to access items which will be pre fetched on you custom name list .item as per List schema
    }
  });
});  

  app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;              // getting name of button that contains value as name of new todolist

    const item = Item({                         // Again to save our new item in Item collection we'll add by mongodb methode.                  
      name: itemName
    });

    item.save();          // it will save our new todolist item directly to database.as soon as we clicked on + button here whole code will run again and this time our foundItems will send 4 total items form database to list.ejs page.
    res.redirect("/");
    // remember at first when ever any data is inserted in db it wont show on webpage until you refresh the page. thats why we use redirect to do this auto.

  });

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;                   //here we logged id of checked item and delete it by findid method and redirected to auto refresh page to immediate removel of checked item form page
  Item.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
      console.log("Successfully deleted checked item");
      res.redirect("/");
    }
  });
  
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
