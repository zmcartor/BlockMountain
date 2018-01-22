(function() {
    var Router = Backbone.Router.extend ({
        routes : {
            "" : "blockRoute",
            "block/:blocknumber" : "blockRoute",
            "transaction/:transhash" : "transactionRoute",
            "address/:addr" : "addressRoute"
        },
    
        web3 : undefined,
    
        initialize : function(opts) {
            this.web3 = opts.web3;
        },
        
        appHook : $("#apphook"),
        
        cleanup : function() {
            this.appHook.empty()
        },
    
        blockRoute : function(number) {
            this.cleanup();
            var num = number || "latest";
            this.web3.eth.getBlock(num, false, function(error, blockObj) {
                if (error != null){
                    alert("error in latest block call boo");
                    console.log(error);
                    return;
                }
                
                var latestBlock = new BlockView({model: blockObj});
                $("#apphook").append(latestBlock.el);
            });

        }, 
    
        transactionRoute : function(trans) {
            this.cleanup();

        },
    
        addressRoute : function(addr) {
            this.cleanup();
            
        }
    });
    
    var BlockView = Backbone.View.extend( {                
        initialize : function(options) {
                this.render();
        },
        
        events: {"click #txns" : "showtxns"},
        
        render : function() {  
            var tf = _.template($("#bt").html());        
            this.$el.html(tf(this.model));
        },
        
        showtxns : function(event){
            console.log("show txxnxnx");
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
    });

}());