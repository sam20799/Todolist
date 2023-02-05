

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { DiffieHellmanGroup } = require("crypto");
mongoose.set('strictQuery', true);
// const mongoDB = "mongodb://127.0.0.1:27017/todolistDB"  for you local mogodb database
const mongoDB = "mongodb+srv://SAM:Janu%401234@cluster0.vmpoy7o.mongodb.net/todolistDB?retryWrites=true&w=majority"; // for cloud database
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const connectionParams = {
  
  useUnifiedTopology: true
}

mongoose.connect(mongoDB, connectionParams,(err)=>{
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
  const customListName = _.capitalize(req.params.customListName);     //_.captalize : to format our custom list name in Li format i.e fitst capital rest small : so that user cant create a list with capital and small name

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
    const listName = req.body.list.trim();              // getting name of button that contains value as name of new todolist
    
    // .trim() took my 3rd day this is my 3rd revisiting this code and finally got it
    // .trim  will remove spaces when we stored the title of todolist in listName variable it stored as string and it contains some extra spaces so trim those space first before use or else you will get err: cant read properties of null i.e cant read spaces
    
    const item = Item({                         // Again to save our new item in Item collection we'll add by mongodb methode.                  
      name: itemName
    });

    if (listName === "Today"){
      item.save();          // it will save our new todolist item directly to database.as soon as we clicked on + button here whole code will run again and this time our foundItems will send 4 total items form database to list.ejs page.
      res.redirect("/");
      // remember at first when ever any data is inserted in db it wont show on webpage until you refresh the page. thats why we use redirect to do this auto.
  
    }else{
      List.findOne({name: listName}, function(err,foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
    }

   
  });

app.post("/delete", function(req,res){
  
  const checkedItemId = req.body.checkbox.trim();                   //here we logged id of checked item and delete it by findid method and redirected to auto refresh page to immediate removel of checked item form page
  
  const hiddenListName = req.body.hiddenListName.trim();

  if(hiddenListName === "Today"){                           // It means the delete req is from root route so find it in Item collection by id and delted it.
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  }else{                                                   // else delete req come form custom list: so we need to find that particular item from our List collection and that item is stored in items array . since it is soted in array we cant simply findby id and delete it.
    List.findOneAndUpdate({name: hiddenListName},{$pull: {items: { _id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/" + hiddenListName);
      }
    });                                                 
  }
  
  // Model.findOne'andUpdate( {condition}, {update}, function(err,result))   we'll pass 3 parameters
  //                        ({what do we want to find}, {what to update so : we want to remove a particular item from array we'll below $pull for that},  {callback for err and result})
  //                         ({so we want to find customlist name from array and that name we stored in hiddenlistname})
  //{$pull: {{field: {-id: value}}}
  //{find an item whose name is :  {form array : {whose _id is: id name}}}
  // $pull : operator removes that specific item from array once it came out from array we can delete it
  // findOne corresponds to foundList: i.e foundList will store the results of our qurey
  
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


const port = process.env.PORT || 3000;



app.listen(port, function() {
  console.log(`app listening on port ${port}`);
});
