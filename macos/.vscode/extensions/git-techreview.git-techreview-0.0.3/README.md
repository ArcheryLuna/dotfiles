# Git-TechReview README

Git-TechReview, GTR, is designed to assist Microsoft Content Developers with documentation collaboration. Markdown and Git work well for public collaboration and simple edits, but it does not support rich commenting, multi-party, simultaneous change tracking, and real-time collaboration. GTR enables this by implementing an export and import to DOCX format for collaboration using Word Online. You can even start a new document in DOCX, collaborate with co-workers in a familiar format, and then import to markdown for final editing and publishing to your site.

## Requirements

- Windows operating system (7, 8.1, or 10).
- Version 1.25 or greater of [Visual Studio Code](https://code.visualstudio.com/).
- Pandoc installed from [http://pandoc.org/installing.html](http://pandoc.org/installing.html).   
>IMPORTANT: For the extension to work properly, Pandoc *must* be installed into your C:\users\\\<alias>\local\pandoc folder.   
>On Windows, this will be done for you if you run the [MSI](https://github.com/jgm/pandoc/releases/download/2.2.2.1/pandoc-2.2.2.1-windows-x86_64.msi) and do _not_ check the box labeled "Install for all users of this machine". If you select that option, it will install Pandoc in your Program Files folder.

## Installation

Getting going with the extension for Visual Studio Code is simple. Just follow these steps:

1. Install Version 1.25 or greater of [Visual Studio Code](https://code.visualstudio.com/) for Windows (7, 8.1, or 10).
2. Download and install the Git-TechReview extension for Visual Studio Code.
3. Wait for the extension to download and reload when prompted.

## Usage

### Export to DOCX

This will export the Markdown file as a DOCX file to a folder that you choose.

1. Open Visual Studio Code.
2. Open any markdown file.
3. Click on the **Export to DOCX** button.  
4. Select the destination folder.

### Import to MD

This will import a DOCX file into a Markdown file in the current Visual Studio Code working folder. It will either overwrite an existing file or create a new one using the name of the DOCX file replacing the DOCX extension with MD.

>NOTE
>The source DOCX will be unaffected, but the for the markdown generation, all revisions will be accepted and all comments will be deleted.

1. Open Visual Studio Code.
2. Open any markdown file.
3. Click on the **Import to MD** button.  
4. Select the source file.

#### Recommendation for Importing an Exported DOCX file

Due to the current known issues with the Import to MD process, we recommend importing to a new markdown file and diff'ing the original and new markdown files. This can be done by renaming your DOCX prior to starting the Import to MD process.

#### Recommendation for Importing a new DOCX file

Details to come later.

## Known Issues

- To trigger either export or import, you must have a Markdown file loaded in VS Code.
- Export to DOCX will remove the data in the YAML metadata block.
- Import to MD does not produce the same Markdown as the original Markdown. Some of these include:
    - Alerts
    - Videos
    - YAML metadata block
    - Other items may be altered as well.

## Future work

- Fix known issues. 
- Add configuration for import/export. For example, default Export to automatically save to your OneDrive folder.

## Release Notes

### 1.0.0

Initial release of Git-TechReview on 7/26/2018.

## Contact us

<a href="mailto:davesw@microsoft.com" rel="noreferrer noopener">Dave</a>
<a href="mailto:derng@microsoft.com" rel="noreferrer noopener">Derrick</a>
<a href="mailto:adudsic@microsoft.com" rel="noreferrer noopener">Adam</a>
