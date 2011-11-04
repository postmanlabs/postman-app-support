
var postman = {};
postman.indexedDB = {};
postman.indexedDB.db = null;

// IndexedDB implementations still use API prefixes
var indexedDB = window.indexedDB || // Use the standard DB API
    window.mozIndexedDB || // Or Firefox's early version of it
    window.webkitIndexedDB;            // Or Chrome's early version
// Firefox does not prefix these two:
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;

function setupDB() {
    postman.indexedDB.open = function() {
        console.log("Trying to open db");
        var request = indexedDB.open("todos", "Desription of the database");
        request.onsuccess = function(e) {
            var v = "1.1";
            postman.indexedDB.db = e.target.result;
            var db = postman.indexedDB.db;
            console.log(db);
            //We can only create Object stores in a setVersion transaction
            if (v != db.version) {
                console.log("Version is not the same");
                var setVrequest = db.setVersion(v);
                setVrequest.onfailure = postman.indexedDB.onerror;
                setVrequest.onsuccess = function(e) {
                    if(db.objectStoreNames.contains("todo")) {
                        db.deleteObjectStore("todo");
                    }

                    var store = db.createObjectStore("todo", {keyPath: "timeStamp"});
                    postman.indexedDB.getAllTodoItems();
                };
            }
            else {
                postman.indexedDB.getAllTodoItems();
            }

        };

        request.onfailure = postman.indexedDB.onerror;
    };

    postman.indexedDB.addTodo = function(todoText) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("todo");

        var request = store.put({
            "text": todoText,
            "timeStamp": new Date().getTime()
        });

        request.onsuccess = function(e) {
            //Re-render all the todos
            console.log("Added element to todo list", request);
            postman.indexedDB.getAllTodoItems();
        };

        request.onerror = function(e) {
            console.log(e.value);
        }
    };

    postman.indexedDB.getAllTodoItems = function() {
        var todos = document.getElementById("todoItems");
        todos.innerHTML = "";

        var db = postman.indexedDB.db;
        var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("todo");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = store.openCursor(keyRange);

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            console.log("Request completed", result);
            if (!!result == false)
                return;

            renderTodo(result.value);
            result.continue();
        };

        console.log("Getting all to do times", cursorRequest, keyRange);

        cursorRequest.onerror = postman.indexedDB.onerror;
    };

    postman.indexedDB.deleteTodo = function(id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE, 0);
        var store = trans.objectStore(["todo"]);

        var request = store.delete(id);

        request.onsucess = function(e) {
            postman.indexedDB.getAllTodoItems();
        };

        request.onerror = function(e) {
            console.log(e);
        };
    };
}

function renderTodo(row) {
    var todos = document.getElementById("todoItems");
    var li = document.createElement("li");
    var a = document.createElement("a");
    var t = document.createTextNode(row.text);

    console.log(row);
    a.addEventListener("click", function(e) {
        postman.indexedDB.deleteTodo(row.text);
    });

    a.textContent = " [Delete]";
    li.appendChild(t);
    li.appendChild(a);
    todos.appendChild(li);
}

function initDB() {
    postman.indexedDB.open(); //Also displays the data previously saved
}

function addTodo() {
    var todo = document.getElementById('todo');
    postman.indexedDB.addTodo(todo.value);
    todo.value = '';
}