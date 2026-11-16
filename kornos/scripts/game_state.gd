extends Node

signal progress_changed
# --- Progressão (linha do tempo) ---
const LEVELS := [
	{"level": 1, "day": 1,  "title": "Reabrindo as portas", "desc": "Limpeza e primeira compra", "scene": "res://scenes/locations/dirty_store.tscn"},
	{"level": 2, "day": 2,  "title": "Dia 2", "desc": "Novos desafios", "scene": "res://scenes/story/day_02.tscn"},
	{"level": 3, "day": 15, "title": "Expansão", "desc": "Contrato e organização", "scene": "res://scenes/story/day_15.tscn"},
	{"level": 4, "day": 45, "title": "Moto Entrega", "desc": "Pedidos online", "scene": "res://scenes/story/day_45.tscn"},
	{"level": 5, "day": 90, "title": "Segurança", "desc": "Câmeras e trigonometria", "scene": "res://scenes/story/day_90.tscn"},
]

var level: int = 1                      # se já existir (ou se chamar current_level), não cole   # se já existir, não cole
var completed_levels: Array[int] = []

# --- Prateleira: posição de cada produto arrastado ---
var shelf_item_positions: Dictionary = {}

var current_day: int = 1
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
		
func get_level_status(n: int) -> String:
	if n in completed_levels:
		return "completed"
	if n <= highest_unlocked_level:
		return "unlocked"
	return "locked"


func complete_level(n: int) -> void:
	if not n in completed_levels:
		completed_levels.append(n)
	highest_unlocked_level = max(highest_unlocked_level, min(n + 1, LEVELS.size()))
	progress_changed.emit()


func start_level(n: int) -> bool:
	if get_level_status(n) == "locked":
		return false
	var data: Dictionary = LEVELS[n - 1]
	current_day = data["day"]
	level = n
	progress_changed.emit()
	SceneTransition.change_scene(data["scene"])
	return true
