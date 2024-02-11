xcode-select --install

git clone https://github.com/ArcheryLuna/dotfiles.git ~/.dotfiles

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew bundle --file ~/.dotfiles/macos/Brewfile

ln -s ~/.dotfiles/macos/.config ~/.config
ln -s ~/.dotfiles/macos/.zshrc ~/
ln -s ~/.dotfiles/macos/.gitconfig ~/
ln -s ~/.dotfiles/macos/.vscode ~/ 
ln -s ~/.dotfiles/macos/.npm ~/

cd ~/.dotfiles