
extends Control

@onready var background_video: VideoStreamPlayer = $BackgroundVideo
@onready var play_button: TextureButton = $PlayButton


func _ready() -> void:
	background_video.loop = true
	background_video.volume_db = -80.0
	background_video.expand = true
	background_video.mouse_filter = Control.MOUSE_FILTER_IGNORE
	background_video.play()

	play_button.pressed.connect(_on_play_button_pressed)


func _on_play_button_pressed() -> void:
	await SceneTransition.change_scene(
        "res://scenes/story/intro.tscn"
	)
