# Define a function that wraps the 'brew' command
brew() {
    # Call the original 'brew' command with all passed arguments
    command brew "$@"

    # Check if the last command (brew) was successful
    if [ $? -eq 0 ]; then
        # Run the desired brew command after the initial brew command succeeds
        echo "Running post-brew command..."
        command brew bundle dump --file=~/.dotfiles/macos/Brewfile --force --describe
        echo "Brewfile updated."
    fi

    # commit the changes to github
    cd ~/.dotfiles
    git add .
    git commit -m "update Brewfile"
    git push

    # return to the original directory
    cd -
}

cls() {
   clear
}

# Ensure you source this script in your .zshrc to make it available in your shell sessions
export PATH="/opt/homebrew/opt/mysql@8.0/bin:$PATH"


eval "$(starship init zsh)"
