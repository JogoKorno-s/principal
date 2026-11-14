extends Node

var current_day: int = 1
var level: int = 1
var xp: int = 0
var money: float = 300.0

var unlocked_areas = {
	"facade": true,
	"main_store": true,
	"shelves": true,
	"storage": true,
	"garage": false,
	"produce": false
}


# PROGRESSÃO DOS NÍVEIS
var highest_unlocked_level: int = 1

# PROGRESSO DO DIA 1
var day_1_cleaning_completed: bool = false
var day_1_purchase_completed: bool = false
var day_1_completed: bool = false

# ESTOQUE COMPRADO
var rice_stock: int = 0
var beans_stock: int = 0
var sugar_stock: int = 0

# RETORNO DA LINHA DO TEMPO
var timeline_return_path: String = ""


func complete_day_1() -> void:
	day_1_cleaning_completed = true
	day_1_purchase_completed = true
	day_1_completed = true

	# Libera o nível 2.
	highest_unlocked_level = max(highest_unlocked_level, 2)


func start_day_2() -> void:
	if highest_unlocked_level >= 2:
		current_day = 2
		level = 2
