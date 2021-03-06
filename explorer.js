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
            
            var router = this;
            this.web3.eth.getTransaction(trans, function(error, blockObj){
                if (error != null){
                    alert("error in latest block call boo");
                    console.log(error);
                    return;
                }
                
                var tx = new TransactionView({"model" : blockObj, "web3" : router.web3, "router" : router})
                $("#apphook").append(tx.el); 
            });
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
                
                if (blockObj == null){
                    alert("This block is fresh, we dont have all the txns set.");
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
            
            this.model.timestamp = this.convertTimestamp(this.model.timestamp);   
            this.$el.html(tf(this.model));
        },
        
        convertTimestamp : function(timestamp) {
          var d = new Date(timestamp * 1000),
        		yyyy = d.getFullYear(),
        		mm = ('0' + (d.getMonth() + 1)).slice(-2),
        		dd = ('0' + d.getDate()).slice(-2),
        		hh = d.getHours(),
        		h = hh,
        		min = ('0' + d.getMinutes()).slice(-2),
        		ampm = 'AM',
        		time;
			
        	if (hh > 12) {
        		h = hh - 12;
        		ampm = 'PM';
        	} else if (hh === 12) {
        		h = 12;
        		ampm = 'PM';
        	} else if (hh == 0) {
        		h = 12;
        	}
	
        	time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
        	return time;
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
                ele["indexVal"] = index;
                ele["eth"] = this.convertToDisplayETH(ele.value, this.web3);
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
    
    // display transactions, no interactivity here.
    // link out to addreses , block number
    
    var TransactionView = Backbone.View.extend({
       
        web3 : undefined,
        router: undefined,
        
        // click block num, click addresses
        events : {"click #sender" : "fromAddrClick",
                  "click #receiver" : "toAddrClick",
                  "click #bnumber" : "blockNumClick" },
        
        initialize : function(opts){
            this.web3 = opts.web3;
            this.router = opts.router;
            
            this.render();
        },
        
        render : function() {
            var t = _.template($("#txn-template").html());
            this.model["eth"] = this.convertToDisplayETH(this.model.value, this.web3);
            
            if (this.model.input.length > 2) {
                console.log(this.model.input);
                this.model["decoded"] = this.web3.toAscii(this.model.input);
            } else {
                this.model["decoded"] = "empty";
            }
            
            this.$el.html(t(this.model));
        },
        
        blockNumClick : function() {
            this.router.navigate("block/"+this.model.blockNumber , true);
        },
        
        fromAddrClick : function() {
            this.router.navigate("address/"+this.model.from, true);
        },
        
        toAddrClick : function() {
            this.router.navigate("address/"+this.model.to, true);
        }
        
    });
    
    var AddressView = Backbone.View.extend({
       
        web3 : undefined,
        router : undefined,
    
        initialize : function(opts){
            // look up the address + transactions?
            // check the latest blocks, and also monitor for any changes to this address by polling every X secs.
            
        },
        
    });
    
    
    Backbone.View.prototype.convertToDisplayETH = function(val, web3) {
      return Number(web3.fromWei(val , "ether")).toFixed(5);  
    };
    
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