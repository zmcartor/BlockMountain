(function() {
    var Router = Backbone.Router.extend ({
        routes : {
            "" : "blockRoute",
            "block/:blocknumber" : "blockRoute",
            "txnslist/:blocknumber" : "transactionList",
            "transaction/:transhash" : "transactionRoute",
            "address/:addr" : "addressRoute"
        },
    
        web3 : undefined,
    
        initialize : function(opts) {
            this.web3 = opts.web3;
        },
        
        appHook : $("#apphook"),
        
        cleanup : function() {
            $('#apphook').empty()
        },
    
        blockRoute : function(number) {
            this.cleanup();
            var num = number || "latest";
            var router = this;
            this.web3.eth.getBlock(num, false, function(error, blockObj) {
                if (error != null){
                    alert("error in latest block call boo");
                    console.log(error);
                    return;
                }
                
                var latestBlock = new BlockView({model: blockObj , "router" : router});
                $("#apphook").append(latestBlock.el);
            });

        }, 
    
        transactionRoute : function(trans) {
            this.cleanup();
            console.log(trans);
        },
        
        transactionList : function(blocknum) {
            this.cleanup();
                
            var router = this;
            this.web3.eth.getBlock(blocknum, true, function(error, blockObj) {
                if (error != null){
                    alert("error in latest block call boo");
                    console.log(error);
                    return;
                }
                
                // TODO sometimes blockObj is null for some reason?!! CATCH THIS
                var txList = new TransactionsListView({"transactions" : blockObj.transactions , "web3" : router.web3, "router" : router})
                $("#apphook").append(txList.el);
            });
            
        },
    
        addressRoute : function(addr) {
            this.cleanup();
        }
        
    });
    
    var BlockView = Backbone.View.extend( {
        
        router : undefined,                
        initialize : function(opts) {
                this.render();
                this.router = opts.router;
        },
        
        events: {"click #txns" : "showtxns"},
        
        render : function() {  
            var tf = _.template($("#bt").html());        
            this.$el.html(tf(this.model));
        },
        
        showtxns : function(event){
            event.stopPropagation;
            this.router.navigate("txnslist/"+this.model.number , true);
        }
    });
    
    var Searchbox = Backbone.View.extend( {
       
        router : undefined,
        web3 : undefined,
        
        initialize : function(opts){
            this.router = opts.router;
            this.el = opts.el;
            this.web3 = opts.web3;
        },
        
        events : { "submit" : "submit" },
        
        submit : function(event){
            event.preventDefault();
            event.stopPropagation();
            
            var input = $("input", this.el).val();
            
            if (this.web3.isAddress(input)){
                this.router.navigate("#address/"+input , true);
                return;
            }
            
            var parsed = Number.parseInt(input, 10);
            if (! Number.isNaN(parsed)){
                this.router.navigate("#block/"+parsed , true);
                return;
            }
            
            // totally BS way to test if transaction hash. IF this fails, web3 wont find it which is fine.
            var startsWith = input.startsWith("0x");
            var validLen = input.slice(2).length == 64;
            
            if (starsWith && validLen){
                this.router.navigate("#transaction/"+input, true);
                return;
            }
        }
    });
    
    var TransactionsListView = Backbone.View.extend({
        
        router : undefined,
        transactions : undefined,
        web3 : undefined,
                
        initialize : function(opts) {
            this.router = opts.router;
            this.transactions = opts.transactions;
            this.web3 = opts.web3;
            
            this.render();
        },
        
        events : {"click .transaction-row" : "transactionClick"},
        
        render : function() {
            
            var table = _.template($("#trans-table").html());
            this.$el.html(table());
            
            var row = _.template($("#trans-row").html());
            _.each(this.transactions , function(ele, index, list) {

                // stick data element on each row.
                ele["indexVal"] = index;
                ele["eth"] = this.web3.fromWei(ele.value , "ether")
                this.$el.find("tbody").append(row(ele));
            }, this);
        },
        
        transactionClick : function(event){
            var index = $(event.target).parent("tr").data("index");
            event.stopPropagation();
            var trans = this.transactions[index];
            this.router.navigate("transaction/"+trans.hash , true);
        }
        
    });
    
    $().ready(function() {        
        var web3 = new Web3( new Web3.providers.HttpProvider("https://mainnet.infura.io/3TntECqcqkTqyRsDoSNu"));
        
        if (typeof web3 == 'undefined'){
            alert('Web3 provider failed to initialize. Nothing will work.');
            return;
        }        
        
        var router = new Router({ "web3" : web3 });
        Backbone.history.start({"pushState" : true});
        
        new Searchbox({"el" : $("form#search"), "router" : router , "web3" : web3});
    });

}());