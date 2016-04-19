angular
    .module('LiveView', ['angular-meteor'])
    .controller('MainController', MainController);

function MainController($scope, $window, $reactive, $timeout) {
    var controller = this;
    $reactive(controller).attach($scope);

    controller.subscribe('directory');
    controller.subscribe('chats');
    controller.updateGraph = updateGraph;

    var width = ($window.window.innerWidth *3/5)  - 10,
        height = $window.window.innerHeight - 10;

    var svg = d3.select('svg.render')
        .attr('width', width)
        .attr('height', height)
        .attr("id", "svg")
        .attr("pointer-events", "all")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .append('svg:g');

    var color = d3.scale.category20();

    var force = d3.layout.force();

    var nodes = force.nodes(),
        links = force.links();

    controller.nodes = force.nodes();
    controller.links = force.links();

    function setNodesLinks() {
        $timeout(function() {
            $scope.$apply(function() {
                controller.nodes = nodes;
                controller.links = links;
            });
        });
    }

    controller.helpers({
        chats: function() {
            var c = Chats.find().fetch();

            links.length = 0; // links
            _.forEach(c, function(chat) {
                var userIds = chat.userIds;
                links.push({
                    "source": _.findIndex(nodes, function (el) {
                        return el.userid === userIds[0];
                    }),
                    "target": _.findIndex(nodes, function (el) {
                        return el.userid === userIds[1];
                    }),
                    "value": 1,
                    "chatId": chat._id,
                    "marked": true
                });
                // if (_.findIndex(links, function(link) {return link.chatId === chat._id}) < 0) {}
            });

            // update graph
            updateGraph();
            setNodesLinks();

            return c;
        },
        users: function() {
            var u = Meteor.users.find({}).fetch();

            _.forEach(u, function(usr) {
                if (_.findIndex(nodes, function(node) {return node.userid === usr._id}) < 0) {
                    nodes.push({
                        "name": usr.profile.name,
                        "group": Math.round(Math.random() * 5),
                        "userid": usr._id
                    });
                }
            });

            // update graph
            updateGraph();
            setNodesLinks();

            return u;
        }
    });

    // D3 *************************************

    function updateGraph() {
        var link =  svg.selectAll(".link")
            .data(links, function(d) {
                return d.source + "-" + d.target;
            });
        link.enter().append("line")
            .attr("id", function (d) {
                return d.source + "-" + d.target;
            })
            .attr("class", "link")
            .attr("stroke-width", function(d) { return Math.sqrt(d.value); });
        link.exit().remove();

        var node = svg.selectAll("g.node")
            .data(nodes, function(d) {
                //console.log(d.userid);
                return d.userid;
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        nodeEnter
            .append("svg:circle")
            .attr("r", 5)
            .attr("id", function (d) {
                return "Node;" + d.userid;
            })
            .style("fill", function(d) { return color(d.group); });

        nodeEnter
            .append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .attr('class', 'node-name')
            .text(function(d) { return d.name });

        node.exit().remove();

        force
            .on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

                //node.attr("cx", function(d) { return d.x; })
                //    .attr("cy", function(d) { return d.y; });
            });

        force
            .charge(-400)
            .linkDistance(80)
            .size([width, height])
            .start();
    }
}