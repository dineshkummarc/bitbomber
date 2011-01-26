/**
 * Game object
 *
 * @constructur
 * @return {Game}
 */
Game = function(width, height) {
	this.world = new OGE.World(width, height, 16);
	this.players = [];
	this.bombs = [];
	this.fires = [];
	this.blocks = [];
	this.bricks = [];

	this.maxPlayers = 4;
};

Game.prototype.getBomb = function(x, y) {
	for (var i = 0; i < this.bombs.length; i++) {
		if (this.bombs[i].x === x && this.bombs[i].y === y) {
			return this.bombs[i];
		}
	}
    return null;
};

Game.prototype.removeBoxes = function(bomb, data) {
	var self = this;
	_.each(data.bodies, function(body) {
		if (body instanceof Box && body.armor === bomb.power) {
			self.removeBody(body);
		}
	});
};

Game.prototype.explodeBomb = function(bomb, data) {
	if (arguments.length === 1) {
		data = {
			x: bomb.x,
			y: bomb.y,
			bodies: [],
			fires: []
		};
	}
	var w = bomb.size * bomb.width,
	h = bomb.size * bomb.height,
	self = this;
	this.removeBody(bomb);
	var checkHit = function(minX, minY, maxX, maxY, firevar) {
		for (var x = bomb.x + minX; x <= bomb.x + maxX; x += bomb.width) {
			for (var y = bomb.y + minY; y <= bomb.y + maxY; y += bomb.height) {
				if (x >= 0 && y >= 0 && x < self.world.width && y < self.world.height) {
					var b = self.world.getBodies(x, y, bomb.width, bomb.height);
					for (var i = 0; i < b.length; i++) {
						var body = b[i];
						if (body !== bomb && body.intersects(x, y, bomb.width, bomb.height)) {
							if (!_.contains(data.bodies, body)) {
								data.bodies.push(body);
							}
							if (body.armor >= bomb.power) {
								return;
							} else {
								self.removeBody(body);
								if (!data.fires[x]) {
									data.fires[x] = [];
								}
								if (!data.fires[x][y]) {
									data.fires[x][y] = firevar;
								}
							}
							if (body instanceof Bomb) {
								self.explodeBomb(body, data);
							}
						}
					}
				}
			}
		}
	};

	checkHit( - w, 0, - bomb.width, 0, 'l');
	checkHit( + bomb.width, 0, + w, 0, 'r');
	checkHit(0, - h, 0, - bomb.height, 'u');
	checkHit(0, + bomb.height, 0, + h, 'd');

	return data;
};

Game.prototype.addBody = function(body, active) {
	if (!this.world.addBody(body, active)) {
		return false;
	}
	if (body instanceof Player) {
		if (this.players.length == this.maxPlayers) {
			return false;
		} else if (this.players.length === 0) {
			this.owner = body;
		}
		this.players.push(body);
	} else if (body instanceof Bomb) {
		this.bombs.push(body);
	}
	return true;
};

Game.prototype.serialize = function() {
	var self = this;
	var data = {
		width: this.world.width,
		height: this.world.height
	};
	var serializeboxes = function(name, attrs) {
		if (self[name].length > 0) {
			var size = self[name][0].width;
			data[name] = {};
			data[name].size = size;
			data[name].pos = [];
			data[name].attrs = {};
			_.each(self[name], function(box) {
				var pos = box.y / size * Math.floor(self.world.width / size) + box.x / size;
				data[name].pos.push(pos);
				_.each(attrs, function(attr) {
					data[name].attrs[attr] = box[attr];
				});
			});
		}
	};
	if (this.players.length > 0) {
		data.players = [];
		_.each(this.players, function(player) {
			data.players.push(player.serialize());
		});
	}

	serializeboxes('blocks', ['armor']);
	serializeboxes('bricks');
	return data;
};

Game.prototype.removeBody = function(body) {
	this.world.removeBody(body);
	this.players = _.without(this.players, body);
	this.bombs = _.without(this.bombs, body);
	this.blocks = _.without(this.blocks, body);
	this.bricks = _.without(this.bricks, body);
};

Game.prototype.getPlayer = function(nick) {
	for (var i = 0; i < this.players.length; i++) {
		if (this.players[i].nick === nick) {
			return this.players[i];
		}
	}
};

Game.prototype.createBlocks = function(size) {
	for (var y = 1; y < this.world.height / size - 2; y += 2) {
		for (var x = 1; x < this.world.width / size - 2; x += 2) {
			var b = new Box(x * size, y * size, size, size);
			b.armor = 2;
			this.blocks.push(b);
			this.addBody(b);
		}
	}
	return this;
};

Game.prototype.createBricks = function(size, percentage) {
	var w = this.world.width / size;
	var h = this.world.height / size;
	for (var y = 0; y < h - 1; y++) {
		for (var x = 0; x < w - 1; x++) {
			if (Math.random() * 100 < percentage && ! (x % 2 === 1 && y % 2 === 1)) {
				if ((x > 1 || y > 1) && (x > 1 || y < h - 2) && (x < w - 2 || y > 1) && (x < w - 2 || y < h - 2)) {
					var c = new Box(x * size, y * size, size, size);
					this.bricks.push(c);
					this.addBody(c);
				}
			}
		}
	}
	return this;
};

Game.deserialize = function(data) {
	var game = new Game(data.width, data.height);
	var deserializeBoxes = function(name) {
		if (data[name].pos.length > 0) {
			var size = data[name].size;
			var boxPrY = Math.floor(data.width / size);
			_.each(data[name].pos, function(pos) {
				var x = pos % boxPrY * size;
				var y = Math.floor(pos / boxPrY) * size;
				var box = new Box(x, y, size, size);
				_.each(data[name].attrs, function(i, attr) {
					box[attr] = data[name].attrs[attr];
				});
				game[name].push(box);
				game.addBody(box);
			});
		}
	};
	deserializeBoxes('blocks');
	deserializeBoxes('bricks');
	if (data.players && data.players.length > 0) {
		_.each(data.players, function(p) {
			game.addBody(Player.deserialize(p), true);
		});
	}
	return game;
};

