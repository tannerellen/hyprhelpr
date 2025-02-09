# HyprHelpr
A useful tool for Hyprland to make common tasks easier. Screencasting with pause / resume, create custom menus, toggle apps in a special workspace, magnify your screen with zoom, and set wallpapers easily with Hyprpaper.

## Table of Contents
- [Installation](#Instalation-and-Usage)
- [Modules](#Modules)
    - [Menu](#Menu)
    - [App Toggle](#Toggle)
    - [Screen Zoom](#Zoom)
    - [Wallpaper](#Wallpaper)
    - [Screencast](#Screencast)
- [Sample Config](#Config)
- [Run From Source](#Run-FromSource)

## Installation and Usage
Download the latest release, unzip and copy the app into any folder in your $PATH like /usr/local/bin/
Alternatively you can launch the app from any directory by specifying the path to it's location like ~/MyApps/hyprhelpr

To use hyprhelpr you specify the module and any arguments. You can read about each module below but it looks like this:
```
hyprhelpr [MODULE] [ARGUMENT] [ARGUMENT]
```

Here are some real world examples:
```
hyprhelpr menu | fuzzel --dmenu
```
```
hyprhelpr toggle pavucontrol
```
```
hyprhelpr zoom 0.5
```
```
hyprhelpr wallpaper set ~/Pictures/Wallpapers/MyImage.jpg
```

## Modules

### Menu
The menu module is used to create menu functionality in any dmenu based app. This allows for easy custom menus in things like rofi, fuzzel, and walker. Menus can be multiple levels deep. 

Outputs a list of menu items that can be piped into any dmenu compatible launcher.

**Usage:**
```
hyprhelpr menu
```

**Config properties:**

- label: Human readable label string that will appear as the menu text.

- command: The command string to run when the menu item is selected. Will run as bash.

- next: Optional array that will indicate there is another sub menu. This can be an empty array if the command itself will bring up a sub menu or can contain an array of objects that contain the proproperties listed above.`


### Toggle
Toggle allows easy setup to toggle apps in hyprland's special workspaces. This works great to quickly show an app and then hide it. Especially usefull for things like interacting with notes, calculator, music players or any other app that you want quick access to but doesn't need to be on screen all the time.

**Usage:**
```
hyprhelper toggle <name specified in config>
```

**Config properties:**

- entries: An array of objects that will contain the properties listed below representing the apps you would like to include as toggleable.

    - name: The unique name string to use when activating the toggle for a particular app.
    
    - command: The command string used to launch the app. If the app is used more places than the toggle it is recommended to make the launch string contain unique identifiers like --class some-class. By default hyprhelpr will use the command as the processMatch to determine if the app is already running or not.

    - processMatch: An optional string for hyprhelpr to match the running process to know if the app is already running or not. Sometimes the way you launch an app isn't the actual process that is running so this is useful for those situations. For example running the flatpak for gedit with "flatpak run gedit" will not actually run that process but will open a process of just "gedit". See the example config for how to handle that situation. You can use a tool like btop or just ps aux | grep "app name" to see what a good string would be to use here if needed.

    - size: A size string in the format that Hyprland window rules uses, ie. "25% 50%".
    

### Zoom
Zoom in on your cursor position. Can be animated or instant. If no zoom amount is specified it will toggle between the zoom amount specified in the config and not zoomed at all.

**Usage:**
```
hyprhelper zoom <optional zoom change amount>
```

**Config properties:**

- default: A positive number specifying the default zoom change value used when toggling zoom. This is used if no zoom value is specified when calling the module.

- animate: A boolean (true, false) wether to animate the zoom.

- duration: A number value representing the duration of the animation in seconds.

- fps: A number specifying how many frames per second the animation will target. Anything under 60 will look choppy. You can experiment with this to get a smooth zoom. 120 provides a very smooth zoom animation.


### Wallpaper
Set a random wallpaper or specific one from a directory. Can set a specific wallpaper if a path is specified or set a random wallpaper if no path is specified. List will list all wallpapers in the directory specified in the config. Useful for passing wallpapers to dmenu.

**Requires:**
[Hyprpaper](https://wiki.hyprland.org/Hypr-Ecosystem/hyprpaper/)

**Usage:**
```
hyprhelper wallpaper <operation (set or list)> <optional wallpaper path>
```

**Config properties:**

- directory: The path string to the directory containing wallpapers.

### Screenshare
A very simple tool for selecting screenshare screens, windows, or a region for [xdg-desktop-portal-hyprland](https://wiki.hyprland.org/Hypr-Ecosystem/xdg-desktop-portal-hyprland/). This will list you share sources in whatever dmenu capable app you specify in the config. A nice feature is this will automatically debounce screenshare requests. This means in apps that ask what you want to share more than once will no longer do so. The default debounce duration is 5 seconds but this can be modified in the config.
**Requires:**
[xdg-desktop-portal-hyprland](https://wiki.hyprland.org/Hypr-Ecosystem/xdg-desktop-portal-hyprland/)
[slurp](https://github.com/emersion/slurp) - For region selection

**Usage:**
```
hyprhelper screenshare
```
This will need to be called from xdg-desktop-portal-hyprland. However this will work best if called via a bash script. So create a simple bash script:
```
#!/bin/bash/
/usr/local/bin/hyprhelpr screenshare
```
Then save that somewhere easy to reference like ~/.config/hypr/scripts/share-picker.sh. Once saved make it executable:
```
chmod +x ~/.config/hyr/scripts/share-picker.sh
```
Now finally reference that script in the ~/.config/hypr/xdph.conf file:
```
screencopy {
	max_fps = 120
	allow_token_by_default = true
	custom_picker_binary = $HOME/.config/hypr/scripts/share-picker.sh
}
```
You will need to restart for that change to take affect. Make sure to add a screenshare section to your config with at least a menuCommand property. See the example config for how that would look.

**Config properties:**

- menuCommand: The command to run to show the list of share sources in a menu. For example "fuzzel --dmenu", the list of sources are piped into the command.
- debounceDuration: An optional number in seconds to wait before bringing up the share menu again. The default is 5 seconds.

### Screencast
Record your screen with either wl-screenrec or wf-recorder. Adds the ability to pause recording, display status in the ui like a timer in waybar. You can also add commands to run on each timer increment and on save. This allows you to upload recorded video or show the folder it's saved in for example.

**Requires:**
- [wl-screenrec](https://github.com/russelltg/wl-screenrec) or [wf-recorder](https://github.com/ammen99/wf-recorder)
- [slurp](https://github.com/emersion/slurp) for region recording

**Usage:**
```
hyprhelper screencast <action> <selection> --saveCommand <commandname> --silent --audio
```
Examples:
```
hyprhelpr screencast start screen --silent
hyprhelpr screencast start region
hyprhelpr screencast pause 
hyprhelpr screencast stop --saveCommand directory
```
The default recording is "screen" so that is optional

**Config properties:**
- recorderExec: The app that will record the screencast for example "wl-screenrec" or "wf-recorder". Default "wf-recorder".
- directory: The directory where the screencast will be saved. Default "~/Videos/Screencasts/"
- format: The video container format (mp4, mkv), the default is mp4 if not specified.
- silent: A boolean (true, false), if true no audio will be recorded.
- onInterfaceUpdateCommand: A command that runs every time the interface needs to be updated. This is every second to adjust the timer and when recording pauses or stops. An example of this is to update a custom waybar module with the current recording state. For example you could create this custom waybar module:
```
"custom/screencast": {
    "exec": "cat ~/.cache/hyprhelpr/screencasts/recording-display",
    "format": "{}",
    "interval": "once",
    "on-click": "hyprhelpr screencast pause",
    "signal": 2
},
```
Then your onInterfaceUpdateCommand would look like:
```
pkill -RTMIN+2 waybar
```
This will reload the waybar module so it updates based on what is currently in the ~/.cache/hyphelper/screencasts/recording-display file which is automatically created and updated by hyprhelpr. The command will also receive the display value as stdin so you can use it directly in a command for example if you wanted to write it to another file:
```
echo $(cat) > ~/test.txt
```
- onSaveCommands: An object containing any commands to run on save. These are named commands so that they can be called individually or the default is to run all of them. The syntax is:
```
"onSaveCommands": {
    "directory": "nohup xargs thunar &",
    "upload": "~/pathtoscript/upload.sh"
}
```
By default all on save commands will run but you can specify --savecommand <name> ie --savecommand upload to run only a specific save command when recording is complete.

The path to the saved file is piped into any onSaveCommand entered. For example if you want to create a script that uploads you may want to assign a variable to the file path to act on the file:
```
#!/bin/bash

filePath=$(cat)
fileName=$(basename "$filePath")
```


## Config
**Save a json formatted config file to: ~/.config/hyprhelpr/config.json**

### Sample Config:

```JSON
{
  "zoom": {
    "default": 0.5,
    "animate": true,
    "duration": 0.2,
    "fps": 60
  },
  "wallpaper": {
    "directory": "~/Wallpapers"
  },
  "screenshare": {
    "menuCommand": "walker --dmenu --keepsort"
  },
  "screencast": {
    "recorderExec": "wl-screenrec",
    "directory": "~/Videos/Screencasts/",
    "silent": false,
    "onSaveCommands": {
      "thunar": "nohup xargs thunar &"
    },
    "onInterfaceUpdateCommand": "pkill -RTMIN+2 waybar"
  },
  "toggle": {
    "entries": [
      {
        "name": "term-calc",
        "command": "kitty --class term-calc -e kalc",
        "size": "30% 40%"
      },
      {
        "name": "term-notes",
        "command": "kitty --class term-notes -e nvim -c 'cd ~/Documents/Notes/Tanner/'",
        "size": "80% 80%"
      },
      {
        "name": "pavucontrol",
        "command": "pavucontrol",
        "size": "40% 80%"
      },
      {
        "name": "gedit",
        "command": "flatpak run org.gnome.gedit --class gedit-toggle",
        "processMatch": "^gedit --class gedit-toggle",
        "size": "60% 80%"
      }
    ]
  },
  "menu": {
    "command": "walker --dmenu --keepsort",
    "entries": [
      {
        "label": "Connect To Server",
        "command": "walker -m ssh",
        "next": []
      },
      {
        "label": "Color Picker",
        "command": "",
        "next": [
          {
            "label": "Hex",
            "command": "sleep 0.2; hyprpicker --format hex | wl-copy"
          },
          {
            "label": "RGB",
            "command": "sleep 0.2; hyprpicker --format rgb | wl-copy"
          }
        ]
      },
      {
        "label": "Set Wallpaper",
        "command": "bun run hyprhelpr wallpaper set \"$(hyprhelpr wallpaper list | walker --dmenu --keepsort)\"",
        "next": []
      }
    ]
  }
}

```

## Run From Source
To run the source code directly clone this repo, navigate to the directory then:

Install bun (or use your favorite package manager):
```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies:
```bash
bun install
```

To run a module -- substitute hyprhelpr for bun run index.js:

```bash
bun run index.js wallpaper set
```

[Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
